import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireProfile } from '@/lib/api-response';
import { MAX_DEPOSIT, MIN_DEPOSIT, formatFcfa } from '@/lib/config';
import { startCheckout } from '@/lib/payments/checkout';

const schema = z.object({
  amount: z.coerce
    .number('Montant invalide.')
    .int('Montant entier en FCFA.')
    .min(MIN_DEPOSIT, `Dépôt minimum : ${formatFcfa(MIN_DEPOSIT)}.`)
    .max(MAX_DEPOSIT, `Dépôt maximum : ${formatFcfa(MAX_DEPOSIT)}.`),
});

// POST - Dépôt : crée une facture PayDunya et renvoie l'URL de paiement.
export async function POST(request: Request) {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const { checkoutUrl } = await startCheckout({
      requestUrl: request.url,
      userId: auth.user.id,
      kind: 'deposit',
      amount: parsed.data.amount,
      description: `Dépôt wallet Izzibusiness (${formatFcfa(parsed.data.amount)})`,
    });
    return apiData({ checkoutUrl });
  } catch (error) {
    return internalError('wallet/deposit', error);
  }
}
