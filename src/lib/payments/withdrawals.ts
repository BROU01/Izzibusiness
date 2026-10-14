import { createServiceClient } from '@/lib/supabase/server';
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
  amount: number;
  status: string;
  phone: string;
  withdraw_mode: string;
  disburse_token: string | null;
}

async function markPaid(row: WithdrawalRow, providerRef: string | null, raw: unknown) {
  const admin = createServiceClient();
  const { data } = await admin
    .from('withdrawals')
    .update({ status: 'paid', provider_ref: providerRef, provider_payload: raw })
    .eq('id', row.id)
    .eq('status', 'processing')
    .select('id');
  if (data && data.length > 0) {
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
  const admin = createServiceClient();
  await admin.rpc('refund_withdrawal', {
    p_id: row.id,
    p_status: 'failed',
    p_note: reason.slice(0, 500),
    p_admin: adminId,
  });
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
  const admin = createServiceClient();

  const { data: locked } = await admin
    .from('withdrawals')
    .update({ status: 'processing', reviewed_by: params.adminId })
    .eq('id', params.withdrawalId)
    .eq('status', 'requested')
    .select('id, user_id, amount, status, phone, withdraw_mode, disburse_token');
  const row = (locked?.[0] ?? null) as WithdrawalRow | null;
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
    await admin
      .from('withdrawals')
      .update({ status: 'requested', admin_note: `Préparation refusée : ${message}`.slice(0, 500) })
      .eq('id', row.id)
      .eq('status', 'processing');
    return { status: 'requested', message: `PayDunya a refusé la préparation : ${message}` };
  }

  await admin.from('withdrawals').update({ disburse_token: disburseToken }).eq('id', row.id);

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
  const admin = createServiceClient();
  let query = admin
    .from('withdrawals')
    .select('id, user_id, amount, status, phone, withdraw_mode, disburse_token');
  query =
    'withdrawalId' in key
      ? query.eq('id', key.withdrawalId)
      : query.eq('disburse_token', key.disburseToken);
  const { data } = await query.maybeSingle();
  const row = data as WithdrawalRow | null;
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
