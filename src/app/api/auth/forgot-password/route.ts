import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { forgotPasswordSchema } from '@/lib/auth/schemas';
import { getAuth } from '@/lib/auth';
import { isEmailConfigured } from '@/lib/email';
import { clientIp, hitRateLimit } from '@/lib/rate-limit';

/**
 * Envoie le lien de réinitialisation. Réponse identique que l'adresse
 * existe ou non (pas d'énumération des comptes).
 */
export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Adresse e-mail invalide.', 400);
  }

  if (!isEmailConfigured()) {
    return apiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'L’envoi d’e-mails n’est pas encore activé. Contacte le support pour récupérer ton compte.',
      503,
    );
  }

  try {
    const allowed =
      (await hitRateLimit(`forgot-ip:${clientIp(request)}`, 10, 60 * 60)) &&
      (await hitRateLimit(`forgot-email:${parsed.data.email}`, 3, 60 * 60));
    if (!allowed) {
      return apiError(
        ERROR_CODES.RATE_LIMITED,
        'Trop de demandes. Patiente une heure avant de réessayer.',
        429,
      );
    }

    await getAuth().api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: '/reset-password' },
      headers: request.headers,
    });
    return apiData({ status: 'sent' });
  } catch (error) {
    return internalError('auth/forgot-password', error);
  }
}
