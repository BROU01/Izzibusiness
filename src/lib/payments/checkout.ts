import { createServiceClient } from '@/lib/supabase/server';
import { createCheckoutInvoice } from '@/lib/paydunya';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Crée la facture PayDunya et la ligne `payments` correspondante.
 * La ligne est insérée avec le jeton renvoyé par PayDunya : l'IPN la
 * retrouve par ce jeton et ne crédite qu'après confirmation serveur.
 */
export async function startCheckout(params: {
  requestUrl: string;
  userId: string;
  kind: 'deposit' | 'membership';
  amount: number;
  description: string;
}): Promise<{ checkoutUrl: string }> {
  const site = getSiteUrl(params.requestUrl);
  const invoice = await createCheckoutInvoice({
    amount: params.amount,
    description: params.description,
    returnUrl: `${site}/dashboard/wallet/paiement`,
    cancelUrl: `${site}/dashboard/wallet?paiement=annule`,
    callbackUrl: `${site}/api/payment/paydunya/ipn`,
    customData: { user_id: params.userId, kind: params.kind },
  });

  const { error } = await createServiceClient().from('payments').insert({
    user_id: params.userId,
    kind: params.kind,
    amount: params.amount,
    provider_token: invoice.token,
    checkout_url: invoice.checkoutUrl,
  });
  if (error) throw error;

  return { checkoutUrl: invoice.checkoutUrl };
}
