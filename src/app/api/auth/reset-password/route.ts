import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { fieldErrors, resetPasswordSchema } from '@/lib/auth/schemas';
import { authErrorCode } from '@/lib/auth/errors';
import { getAuth } from '@/lib/auth';

const bodySchema = z.object({ token: z.string().min(10).max(200) }).and(resetPasswordSchema);

/**
 * Nouveau mot de passe à partir du jeton reçu par e-mail
 * (/reset-password?token=…). Toutes les sessions du compte sont fermées.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return Response.json(
      {
        error: {
          code: ERROR_CODES.INVALID_PAYLOAD,
          message: fields.token
            ? 'Lien de réinitialisation invalide. Refais une demande.'
            : (Object.values(fields)[0] ?? 'Mot de passe invalide.'),
          fields,
        },
      },
      { status: 400 },
    );
  }

  try {
    await getAuth().api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
      headers: request.headers,
    });
    return apiData({ status: 'updated' });
  } catch (error) {
    if (authErrorCode(error) === 'INVALID_TOKEN') {
      return apiError(
        ERROR_CODES.INVALID_PAYLOAD,
        'Ce lien a expiré ou a déjà servi. Refais une demande de réinitialisation.',
        400,
      );
    }
    return internalError('auth/reset-password', error);
  }
}
