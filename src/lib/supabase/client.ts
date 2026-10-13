'use client';

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv, SupabaseNotConfiguredError } from './env';

let browserClient: SupabaseClient | null = null;

/**
 * Client navigateur partageant la session cookie posée par le serveur.
 * Soumis à la RLS : il ne lit que les données de l'utilisateur connecté.
 */
export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const env = getSupabasePublicEnv();
  if (!env) throw new SupabaseNotConfiguredError();
  browserClient = createSsrBrowserClient(env.url, env.anonKey);
  return browserClient;
}
