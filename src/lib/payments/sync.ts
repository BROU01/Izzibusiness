import { callFunction, queryOne } from '@/lib/db';
import { confirmInvoice } from '@/lib/paydunya';
import { REFERRAL_BONUS, formatFcfa } from '@/lib/config';
import { createNotification } from '@/lib/notifications';

export type SyncOutcome = 'completed' | 'pending' | 'failed' | 'cancelled' | 'unknown';

/**
 * Aligne un paiement local sur son statut réel chez PayDunya.
 * Appelé par l'IPN et par la page de retour : idempotent (complete_payment
 * verrouille la ligne et ignore un paiement déjà complété).
 */
export async function syncPaymentFromProvider(token: string): Promise<SyncOutcome> {
  const payment = await queryOne<{
    id: string;
    user_id: string;
    kind: 'deposit' | 'membership';
    amount: string;
    status: string;
  }>('select id, user_id, kind, amount, status from payments where provider_token = $1', [token]);
  if (!payment) return 'unknown';
  if (payment.status === 'completed') return 'completed';

  const invoice = await confirmInvoice(token);

  if (invoice.status === 'completed') {
    // Le montant payé doit correspondre exactement à la facture créée.
    if (Math.round(invoice.totalAmount) !== Math.round(Number(payment.amount))) {
      await callFunction('fail_payment', [
        token,
        'failed',
        JSON.stringify({ reason: 'amount_mismatch', provider: invoice.raw }),
      ]);
      return 'failed';
    }

    const result = await callFunction<{ success?: boolean; duplicate?: boolean } | null>(
      'complete_payment',
      [token, JSON.stringify(invoice.raw), REFERRAL_BONUS],
    );
    if (result?.success && !result.duplicate) {
      await createNotification(
        payment.kind === 'deposit'
          ? {
              userId: payment.user_id,
              title: 'Dépôt reçu',
              message: `${formatFcfa(Number(payment.amount))} ont été ajoutés à ton wallet.`,
              type: 'transaction',
              actionUrl: '/dashboard/wallet',
            }
          : {
              userId: payment.user_id,
              title: 'Adhésion activée',
              message: 'Ton adhésion est active : jeux, missions et retraits sont débloqués.',
              type: 'success',
              actionUrl: '/dashboard',
            },
      );
    }
    return 'completed';
  }

  if (invoice.status === 'cancelled' || invoice.status === 'failed') {
    await callFunction('fail_payment', [token, invoice.status, JSON.stringify(invoice.raw)]);
    return invoice.status;
  }

  return 'pending';
}
