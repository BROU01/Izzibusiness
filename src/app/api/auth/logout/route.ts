import { headers } from 'next/headers';
import { apiData, internalError } from '@/lib/api-response';
import { getAuth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';

/** Déconnexion : supprime la session en base et efface les cookies. */
export async function POST() {
  try {
    if (isDatabaseConfigured()) {
      await getAuth()
        .api.signOut({ headers: await headers() })
        .catch(() => undefined);
    }
    return apiData({ status: 'signed_out' });
  } catch (error) {
    return internalError('auth/logout', error);
  }
}
