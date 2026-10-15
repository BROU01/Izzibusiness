import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { emailSchema, loginSchema, usernameSchema } from '@/lib/auth/schemas';
import { authErrorCode } from '@/lib/auth/errors';
import { getAuth } from '@/lib/auth';
import { clientIp, hitRateLimit } from '@/lib/rate-limit';

const INVALID = 'Pseudo, e-mail ou mot de passe incorrect.';

/**
 * Connexion par pseudo OU e-mail + mot de passe. Message d'erreur identique
 * dans tous les cas pour ne pas révéler quels comptes existent.
 */
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(
      ERROR_CODES.INVALID_PAYLOAD,
      'Indique ton identifiant et ton mot de passe.',
      400,
    );
  }

  const { identifier, password } = parsed.data;

  try {
    const ip = clientIp(request);
    const allowed =
      (await hitRateLimit(`login-ip:${ip}`, 30, 15 * 60)) &&
      (await hitRateLimit(`login-id:${identifier.toLowerCase()}`, 8, 15 * 60));
    if (!allowed) {
      return apiError(
        ERROR_CODES.RATE_LIMITED,
        'Trop de tentatives. Patiente un quart d’heure avant de réessayer.',
        429,
      );
    }

    const auth = getAuth();
    try {
      if (identifier.includes('@')) {
        const email = emailSchema.safeParse(identifier);
        if (!email.success) return apiError(ERROR_CODES.INVALID_CREDENTIALS, INVALID, 401);
        await auth.api.signInEmail({
          body: { email: email.data, password },
          headers: request.headers,
        });
      } else {
        const username = usernameSchema.safeParse(identifier);
        if (!username.success) return apiError(ERROR_CODES.INVALID_CREDENTIALS, INVALID, 401);
        await auth.api.signInUsername({
          body: { username: username.data, password },
          headers: request.headers,
        });
      }
    } catch (error) {
      const code = authErrorCode(error);
      if (code === 'FAILED_TO_CREATE_SESSION') {
        // Refus du hook de session : compte suspendu (mot de passe correct).
        return apiError(ERROR_CODES.FORBIDDEN, 'Ce compte est suspendu. Contacte le support.', 403);
      }
      if (code) return apiError(ERROR_CODES.INVALID_CREDENTIALS, INVALID, 401);
      throw error;
    }

    return apiData({ status: 'signed_in' });
  } catch (error) {
    return internalError('auth/login', error);
  }
}
