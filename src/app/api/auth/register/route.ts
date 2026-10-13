import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { fieldErrors, registerSchema } from '@/lib/auth/schemas';
import { toE164 } from '@/lib/auth/countries';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Inscription : pseudo, e-mail, pays, téléphone, parrain, mot de passe.
 * Le profil et le wallet sont créés par le trigger SQL `handle_new_user`
 * (migration 006) à partir des métadonnées passées à signUp.
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
    return Response.json(
      {
        error: {
          code: ERROR_CODES.INVALID_PAYLOAD,
          message: 'Numéro de téléphone invalide pour ce pays.',
          fields: { phone: 'Numéro de téléphone invalide pour ce pays.' },
        },
      },
      { status: 400 },
    );
  }

  try {
    const admin = createServiceClient();

    // Unicité vérifiée avant signUp pour renvoyer un message précis ;
    // les contraintes UNIQUE en base restent le garde-fou final.
    const [{ data: byUsername }, { data: byPhone }] = await Promise.all([
      admin.from('profiles').select('id').eq('username', username).maybeSingle(),
      admin.from('profiles').select('id').eq('phone', phone).maybeSingle(),
    ]);
    if (byUsername) {
      return conflict('username', 'Ce pseudo est déjà pris.');
    }
    if (byPhone) {
      return conflict('phone', 'Ce numéro est déjà associé à un compte.');
    }

    if (referralCode) {
      const { data: sponsor } = await admin
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();
      if (!sponsor) {
        return Response.json(
          {
            error: {
              code: ERROR_CODES.INVALID_PAYLOAD,
              message: 'Ce code de parrainage n’existe pas.',
              fields: { referralCode: 'Ce code de parrainage n’existe pas.' },
            },
          },
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl(request.url)}/auth/callback?next=/dashboard`,
        data: {
          username,
          country,
          phone,
          referred_by: referralCode ?? null,
        },
      },
    });

    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        return conflict('email', 'Cette adresse e-mail est déjà utilisée.');
      }
      if (error.code === 'weak_password') {
        return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Mot de passe trop faible.', 400);
      }
      if (error.status === 429) {
        return apiError(
          ERROR_CODES.RATE_LIMITED,
          'Trop de tentatives. Patiente quelques minutes.',
          429,
        );
      }
      return internalError('auth/register', error);
    }

    return apiData({ status: data.session ? 'signed_in' : 'confirm_email', email }, 201);
  } catch (error) {
    return internalError('auth/register', error);
  }
}

function conflict(field: string, message: string) {
  return Response.json(
    { error: { code: ERROR_CODES.CONFLICT, message, fields: { [field]: message } } },
    { status: 409 },
  );
}
