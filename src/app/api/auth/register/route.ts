import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { fieldErrors, registerSchema } from '@/lib/auth/schemas';
import { toE164 } from '@/lib/auth/countries';
import { authErrorCode } from '@/lib/auth/errors';
import { getAuth } from '@/lib/auth';
import { callFunction, query, queryOne } from '@/lib/db';
import { clientIp, hitRateLimit } from '@/lib/rate-limit';

/**
 * Inscription : pseudo, e-mail, pays, téléphone, parrain, mot de passe.
 * Better Auth crée le compte et ouvre la session (cookie httpOnly), puis la
 * fonction SQL create_member crée le profil et le wallet.
 */
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return Response.json(
      {
        error: {
          code: ERROR_CODES.INVALID_PAYLOAD,
          message: Object.values(fields)[0] ?? 'Formulaire invalide.',
          fields,
        },
      },
      { status: 400 },
    );
  }

  const { username, email, country, password, referralCode } = parsed.data;
  const phone = toE164(country, parsed.data.phone);
  if (!phone) {
    return fieldError('phone', 'Numéro de téléphone invalide pour ce pays.', 400);
  }

  try {
    if (!(await hitRateLimit(`register:${clientIp(request)}`, 5, 60 * 60))) {
      return apiError(
        ERROR_CODES.RATE_LIMITED,
        'Trop d’inscriptions depuis cette connexion. Réessaie dans une heure.',
        429,
      );
    }

    // Unicité vérifiée avant création pour renvoyer un message précis ;
    // les contraintes UNIQUE en base restent le garde-fou final.
    const [byUsername, byEmail, byPhone] = await Promise.all([
      queryOne('select 1 from "user" where username = $1', [username]),
      queryOne('select 1 from "user" where email = $1', [email]),
      queryOne('select 1 from profiles where phone = $1', [phone]),
    ]);
    if (byUsername) return fieldError('username', 'Ce pseudo est déjà pris.', 409);
    if (byEmail) return fieldError('email', 'Cette adresse e-mail est déjà utilisée.', 409);
    if (byPhone) return fieldError('phone', 'Ce numéro est déjà associé à un compte.', 409);

    if (referralCode) {
      const sponsor = await queryOne('select 1 from profiles where referral_code = $1', [
        referralCode,
      ]);
      if (!sponsor) {
        return fieldError('referralCode', 'Ce code de parrainage n’existe pas.', 400);
      }
    }

    let userId: string;
    try {
      const result = await getAuth().api.signUpEmail({
        body: { email, password, name: username, username },
        headers: request.headers,
      });
      userId = result.user.id;
    } catch (error) {
      const code = authErrorCode(error);
      if (code === 'USERNAME_IS_ALREADY_TAKEN') {
        return fieldError('username', 'Ce pseudo est déjà pris.', 409);
      }
      if (code?.startsWith('USER_ALREADY_EXISTS')) {
        return fieldError('email', 'Cette adresse e-mail est déjà utilisée.', 409);
      }
      throw error;
    }

    try {
      await callFunction('create_member', [userId, phone, country, referralCode ?? null]);
    } catch (error) {
      // Profil impossible (numéro pris entre-temps…) : on n'abandonne pas un
      // compte sans profil ni wallet. Les sessions partent avec (cascade).
      await query('delete from "user" where id = $1', [userId]);
      if (isUniqueViolation(error)) {
        return fieldError('phone', 'Ce numéro est déjà associé à un compte.', 409);
      }
      throw error;
    }

    return apiData({ status: 'signed_in' }, 201);
  } catch (error) {
    return internalError('auth/register', error);
  }
}

function fieldError(field: string, message: string, status: number) {
  const code = status === 409 ? ERROR_CODES.CONFLICT : ERROR_CODES.INVALID_PAYLOAD;
  return Response.json({ error: { code, message, fields: { [field]: message } } }, { status });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
