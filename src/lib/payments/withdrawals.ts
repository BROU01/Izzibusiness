import { callFunction, query, queryOne } from '@/lib/db';
import {
  checkDisburseStatus,
  createDisburseInvoice,
  submitDisburseInvoice,
  type DisburseStatus,
} from '@/lib/paydunya';
import { COUNTRIES } from '@/lib/auth/countries';
import { createNotification } from '@/lib/notifications';
import { formatFcfa } from '@/lib/config';
import { getSiteUrl } from '@/lib/site-url';

/** Numéro national (sans indicatif) attendu par PayDunya comme `account_alias`. */
export function toAccountAlias(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const country = COUNTRIES.find((c) => digits.startsWith(c.dial));
  return country ? digits.slice(country.dial.length) : digits;
}

interface WithdrawalRow {
  id: string;
  user_id: string;
  /** numeric renvoyé en texte par pg. */
  amount: string;
  status: string;
  phone: string;
  withdraw_mode: string;
  disburse_token: string | null;
}

const ROW_COLUMNS = 'id, user_id, amount, status, phone, withdraw_mode, disburse_token';

async function markPaid(row: WithdrawalRow, providerRef: string | null, raw: unknown) {
  const updated = await query(
    `update withdrawals set status = 'paid', provider_ref = $2, provider_payload = $3
      where id = $1 and status = 'processing'
      returning id`,
    [row.id, providerRef, JSON.stringify(raw ?? null)],
  );
  if (updated.length > 0) {
    await createNotification({
      userId: row.user_id,
      title: 'Retrait envoyé',
      message: `${formatFcfa(Number(row.amount))} ont été envoyés sur ton compte Mobile Money.`,
      type: 'transaction',
      actionUrl: '/dashboard/wallet',
    });
  }
}

async function markFailed(row: WithdrawalRow, reason: string, adminId: string | null) {
  await callFunction('refund_withdrawal', [row.id, 'failed', reason.slice(0, 500), adminId]);
  await createNotification({
    userId: row.user_id,
    title: 'Retrait non abouti',
    message: `Le retrait de ${formatFcfa(Number(row.amount))} n’a pas pu être envoyé. Le montant et les frais sont revenus sur ton wallet.`,
    type: 'warning',
    actionUrl: '/dashboard/wallet',
  });
}

/**
 * Validation admin : prépare puis exécute le déboursement PayDunya.
 * Le passage requested → processing est conditionnel : deux clics admin
 * simultanés ne déclenchent qu'un seul paiement.
 */
export async function payWithdrawal(params: {
  withdrawalId: string;
  adminId: string;
  requestUrl: string;
}): Promise<{ status: 'paid' | 'processing' | 'failed' | 'requested'; message: string }> {
  const row = await queryOne<WithdrawalRow>(
    `update withdrawals set status = 'processing', reviewed_by = $2
      where id = $1 and status = 'requested'
      returning ${ROW_COLUMNS}`,
    [params.withdrawalId, params.adminId],
  );
  if (!row) {
    return { status: 'failed', message: 'Retrait introuvable ou déjà traité.' };
  }

  let disburseToken: string;
  try {
    disburseToken = await createDisburseInvoice({
      accountAlias: toAccountAlias(row.phone),
      amount: Math.round(Number(row.amount)),
      withdrawMode: row.withdraw_mode,
      callbackUrl: `${getSiteUrl(params.requestUrl)}/api/payment/paydunya/disburse`,
    });
  } catch (error) {
    // Rien n'a été envoyé : le retrait repasse en attente pour un nouvel essai.
    const message = error instanceof Error ? error.message : 'Erreur PayDunya';
    await query(
      `update withdrawals set status = 'requested', admin_note = $2
        where id = $1 and status = 'processing'`,
      [row.id, `Préparation refusée : ${message}`.slice(0, 500)],
    );
    return { status: 'requested', message: `PayDunya a refusé la préparation : ${message}` };
  }

  await query('update withdrawals set disburse_token = $2 where id = $1', [row.id, disburseToken]);

  try {
    const result = await submitDisburseInvoice(disburseToken, row.id);
    if (result.status === 'success') {
      await markPaid(row, result.providerRef, result.raw);
      return { status: 'paid', message: 'Paiement envoyé.' };
    }
    if (result.status === 'failed') {
      const text =
        typeof result.raw.response_text === 'string' ? result.raw.response_text : 'Échec PayDunya';
      await markFailed(row, text, params.adminId);
      return { status: 'failed', message: `Échec : ${text}. Le membre a été remboursé.` };
    }
    return { status: 'processing', message: 'Paiement en cours chez l’opérateur.' };
  } catch {
    // Issue inconnue (réseau) : ne pas rembourser à l'aveugle, vérifier le statut.
    return {
      status: 'processing',
      message: 'Réponse PayDunya non reçue. Utilise « Vérifier le statut » dans quelques minutes.',
    };
  }
}

/** Relit le statut d'un déboursement chez PayDunya et met le retrait à jour. */
export async function refreshWithdrawalStatus(
  key: { withdrawalId: string } | { disburseToken: string },
  adminId: string | null = null,
): Promise<DisburseStatus | 'unknown'> {
  const row =
    'withdrawalId' in key
      ? await queryOne<WithdrawalRow>(`select ${ROW_COLUMNS} from withdrawals where id = $1`, [
          key.withdrawalId,
        ])
      : await queryOne<WithdrawalRow>(
          `select ${ROW_COLUMNS} from withdrawals where disburse_token = $1`,
          [key.disburseToken],
        );
  if (!row || !row.disburse_token || row.status !== 'processing') return 'unknown';

  const result = await checkDisburseStatus(row.disburse_token);
  if (result.status === 'success') {
    await markPaid(row, null, result.raw);
  } else if (result.status === 'failed') {
    const text =
      typeof result.raw.response_text === 'string' ? result.raw.response_text : 'Échec PayDunya';
    await markFailed(row, text, adminId);
  }
  return result.status;
}
