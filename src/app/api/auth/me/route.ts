import { apiData, internalError, requireUser } from '@/lib/api-response';

/** Profil minimal de l'utilisateur connecté (navigation, tableau de bord). */
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('username, name, role, is_member, referral_code, country')
      .eq('id', auth.user.id)
      .maybeSingle();

    return apiData({
      id: auth.user.id,
      email: auth.user.email ?? null,
      username: profile?.username ?? null,
      name: profile?.name ?? null,
      role: profile?.role === 'admin' ? 'admin' : 'user',
      isMember: profile?.is_member === true,
      referralCode: profile?.referral_code ?? null,
      country: profile?.country ?? null,
    });
  } catch (error) {
    return internalError('auth/me', error);
  }
}
