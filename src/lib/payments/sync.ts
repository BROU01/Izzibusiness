import { createServiceClient } from '@/lib/supabase/server';
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
  const admin = createServiceClient();

  const { data: payment } = await admin
    .from('payments')
    .select('id, user_id, kind, amount, status')
    .eq('provider_token', token)
    .maybeSingle();
  if (!payment) return 'unknown';
  if (payment.status === 'completed') return 'completed';

  const invoice = await confirmInvoice(token);

  if (invoice.status === 'completed') {
    // Le montant payé doit correspondre exactement à la facture créée.
    if (Math.round(invoice.totalAmount) !== Math.round(Number(payment.amount))) {
      await admin.rpc('fail_payment', {
        p_token: token,
        p_status: 'failed',
        p_payload: { reason: 'amount_mismatch', provider: invoice.raw },
      });
      return 'failed';
    }

    const { data } = await admin.rpc('complete_payment', {
      p_token: token,
      p_payload: invoice.raw,
      p_referral_bonus: REFERRAL_BONUS,
    });
    const result = data as { success?: boolean; duplicate?: boolean } | null;
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
    await admin.rpc('fail_payment', {
      p_token: token,
      p_status: invoice.status,
      p_payload: invoice.raw,
    });
    return invoice.status;
  }

  return 'pending';
}
