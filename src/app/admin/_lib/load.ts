import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { QueryResultRow } from 'pg';
import { query } from '@/lib/db';
import { getCurrentProfile, type MemberProfile } from '@/lib/session';

/**
 * Outils des pages serveur /admin. Serveur uniquement (accès direct à la base).
 */

/**
 * Profil admin de la requête, sinon redirection vers l'espace membre.
 * Appelé par le layout ET par chaque page qui lit la base : lors d'une
 * navigation côté client, Next ne réexécute que la page, pas le layout.
 * `cache` évite la double lecture dans une même requête.
 */
export const requireAdminPage = cache(async (): Promise<MemberProfile> => {
  let profile: MemberProfile | null = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }
  if (!profile || profile.role !== 'admin' || profile.isBanned) redirect('/dashboard');
  return profile;
});

/** Convertit les dates renvoyées par pg (objets Date) en chaînes ISO. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

function serialize<T extends QueryResultRow>(row: T): Serialized<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out as Serialized<T>;
}

/**
 * Lecture pour une page admin : ne lève pas d'exception, renvoie `error: true`
 * pour afficher <LoadError /> (même comportement qu'avant la migration).
 */
export async function load<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<{ data: Serialized<T>[]; error: boolean }> {
  try {
    const rows = await query<T>(sql, params);
    return { data: rows.map(serialize), error: false };
  } catch {
    return { data: [], error: true };
  }
}

/** Échappe %, _ et \ pour une recherche `ilike` (motif passé en paramètre). */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
