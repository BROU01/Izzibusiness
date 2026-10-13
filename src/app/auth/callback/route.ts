import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/auth/schemas';

const OTP_TYPES: EmailOtpType[] = ['signup', 'recovery', 'email', 'email_change', 'invite'];

/**
 * Point d'arrivée des liens e-mail Supabase (confirmation d'inscription,
 * réinitialisation du mot de passe). Échange le code contre une session
 * cookie puis redirige vers `next` (chemin interne uniquement).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get('next'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    } else if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  } catch {
    // Configuration absente : même redirection d'erreur.
  }

  const failure = next === '/reset-password' ? '/forgot-password' : '/login';
  return NextResponse.redirect(`${origin}${failure}?error=link_expired`);
}
