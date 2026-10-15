import { query } from '@/lib/db';
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

  await query(
    `insert into payments (user_id, kind, amount, provider_token, checkout_url)
     values ($1, $2, $3, $4, $5)`,
    [params.userId, params.kind, params.amount, invoice.token, invoice.checkoutUrl],
  );

  return { checkoutUrl: invoice.checkoutUrl };
}
