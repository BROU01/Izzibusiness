import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { forgotPasswordSchema } from '@/lib/auth/schemas';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Envoie le lien de réinitialisation. Réponse identique que l'adresse
 * existe ou non (pas d'énumération des comptes).
 */
export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Adresse e-mail invalide.', 400);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getSiteUrl(request.url)}/auth/callback?next=/reset-password`,
    });
    if (error?.status === 429) {
      return apiError(
        ERROR_CODES.RATE_LIMITED,
        'Trop de demandes. Patiente quelques minutes avant de réessayer.',
        429,
      );
    }
    if (error) console.error('[auth/forgot-password]', error.message);
    return apiData({ status: 'sent' });
  } catch (error) {
    return internalError('auth/forgot-password', error);
  }
}
