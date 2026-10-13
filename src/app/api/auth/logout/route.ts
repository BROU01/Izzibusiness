import { apiData, internalError } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return apiData({ status: 'signed_out' });
  } catch (error) {
    return internalError('auth/logout', error);
  }
}
