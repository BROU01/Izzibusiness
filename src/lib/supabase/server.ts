import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabasePublicEnv, SupabaseNotConfiguredError } from './env';

/**
 * Client lié à la session de l'utilisateur (cookies httpOnly gérés par
 * @supabase/ssr). Respecte la RLS : à utiliser par défaut dans les routes
 * API et les composants serveur.
 */
export async function createClient(): Promise<SupabaseClient> {
  const env = getSupabasePublicEnv();
  if (!env) throw new SupabaseNotConfiguredError();

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appel depuis un Server Component : écriture impossible, le
          // proxy (src/proxy.ts) se charge du rafraîchissement de session.
        }
      },
    },
  });
}

/**
 * Client service_role : contourne la RLS. Réservé au serveur pour les
 * opérations que l'utilisateur ne peut pas faire lui-même (résolution
 * pseudo → e-mail, crédit de wallet après paiement vérifié, notifications).
 * Ne jamais importer depuis un composant client.
 */
export function createServiceClient(): SupabaseClient {
  const env = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceKey) throw new SupabaseNotConfiguredError();

  return createSupabaseClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
