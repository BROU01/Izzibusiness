import { apiData, internalError } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { SupabaseNotConfiguredError } from '@/lib/supabase/env';

/**
 * Profil minimal de l'utilisateur connecté (navigation, tableau de bord).
 * Un visiteur anonyme reçoit `{ data: null }` (200) : ce n'est pas une
 * erreur, c'est l'état normal des pages publiques.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiData(null);

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, name, role, is_member, referral_code, country')
      .eq('id', user.id)
      .maybeSingle();

    return apiData({
      id: user.id,
      email: user.email ?? null,
      username: profile?.username ?? null,
      name: profile?.name ?? null,
      role: profile?.role === 'admin' ? 'admin' : 'user',
      isMember: profile?.is_member === true,
      referralCode: profile?.referral_code ?? null,
      country: profile?.country ?? null,
    });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) return apiData(null);
    return internalError('auth/me', error);
  }
}
