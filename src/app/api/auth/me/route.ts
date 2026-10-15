import { apiData, internalError } from '@/lib/api-response';
import { getCurrentProfile } from '@/lib/session';

/**
 * Profil minimal de l'utilisateur connecté (navigation, tableau de bord).
 * Un visiteur anonyme reçoit `{ data: null }` (200) : ce n'est pas une
 * erreur, c'est l'état normal des pages publiques.
 */
export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return apiData(null);
    return apiData({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role,
      isMember: profile.isMember,
      referralCode: profile.referralCode,
      country: profile.country,
      phone: profile.phone,
      isBanned: profile.isBanned,
    });
  } catch (error) {
    return internalError('auth/me', error);
  }
}
