import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireUser } from '@/lib/api-response';
import { fieldErrors, resetPasswordSchema } from '@/lib/auth/schemas';

/**
 * Nouveau mot de passe. Nécessite la session de récupération ouverte par
 * le lien e-mail (/auth/callback?next=/reset-password).
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = resetPasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error);
      return Response.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PAYLOAD,
            message: Object.values(fields)[0] ?? 'Mot de passe invalide.',
            fields,
          },
        },
        { status: 400 },
      );
    }

    const { error } = await auth.supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      if (error.code === 'same_password') {
        return apiError(
          ERROR_CODES.INVALID_PAYLOAD,
          'Choisis un mot de passe différent de l’ancien.',
          400,
        );
      }
      if (error.code === 'weak_password') {
        return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Mot de passe trop faible.', 400);
      }
      return internalError('auth/reset-password', error);
    }
    return apiData({ status: 'updated' });
  } catch (error) {
    return internalError('auth/reset-password', error);
  }
}
