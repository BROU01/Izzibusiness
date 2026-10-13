/**
 * Lecture des variables Supabase publiques. Aucune valeur de repli :
 * sans configuration, l'application refuse l'authentification au lieu
 * de simuler une session (l'ancien « mode démo » acceptait n'importe qui).
 */
export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase n’est pas configuré (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
    this.name = 'SupabaseNotConfiguredError';
  }
}
