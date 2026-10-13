import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { emailSchema, loginSchema, usernameSchema } from '@/lib/auth/schemas';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const INVALID = 'Pseudo, e-mail ou mot de passe incorrect.';

/**
 * Connexion par pseudo OU e-mail + mot de passe. Le pseudo est résolu en
 * e-mail côté serveur (client service_role) : la table profiles n'est pas
 * lisible publiquement. Message d'erreur identique dans tous les cas pour
 * ne pas révéler quels comptes existent.
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
    let email: string | null = null;
    if (identifier.includes('@')) {
      const asEmail = emailSchema.safeParse(identifier);
      email = asEmail.success ? asEmail.data : null;
    } else {
      const asUsername = usernameSchema.safeParse(identifier);
      if (asUsername.success) {
        const { data } = await createServiceClient()
          .from('profiles')
          .select('email')
          .eq('username', asUsername.data)
          .maybeSingle();
        email = typeof data?.email === 'string' ? data.email : null;
      }
    }

    if (!email) {
      return apiError(ERROR_CODES.INVALID_CREDENTIALS, INVALID, 401);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code === 'email_not_confirmed') {
        return apiError(
          ERROR_CODES.EMAIL_NOT_CONFIRMED,
          'Confirme d’abord ton adresse e-mail grâce au lien reçu.',
          403,
        );
      }
      if (error.status === 429) {
        return apiError(
          ERROR_CODES.RATE_LIMITED,
          'Trop de tentatives. Patiente quelques minutes.',
          429,
        );
      }
      if (error.code === 'invalid_credentials' || error.status === 400) {
        return apiError(ERROR_CODES.INVALID_CREDENTIALS, INVALID, 401);
      }
      return internalError('auth/login', error);
    }

    return apiData({ status: 'signed_in' });
  } catch (error) {
    return internalError('auth/login', error);
  }
}
