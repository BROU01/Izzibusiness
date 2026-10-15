import { headers } from 'next/headers';
import { getAuth } from './auth';
import { isDatabaseConfigured, queryOne } from './db';

/**
 * Lecture de la session côté serveur (routes API, composants serveur).
 * Serveur uniquement.
 */

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
}

/** Utilisateur connecté, ou null (visiteur, session expirée, base non configurée). */
export async function getSessionUser(requestHeaders?: Headers): Promise<SessionUser | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await getAuth().api.getSession({
    headers: requestHeaders ?? (await headers()),
  });
  if (!session) return null;
  const user = session.user as typeof session.user & { username?: string | null };
  return { id: user.id, email: user.email, username: user.username ?? null };
}

export interface MemberProfile {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'admin';
  isMember: boolean;
  isBanned: boolean;
  country: string | null;
  phone: string | null;
  referralCode: string | null;
  gamesAcceptedAt: string | null;
}

interface ProfileRow {
  id: string;
  email: string;
  username: string | null;
  role: string;
  is_member: boolean;
  is_banned: boolean;
  country: string | null;
  phone: string | null;
  referral_code: string | null;
  games_accepted_at: Date | null;
}

/** Profil métier d'un compte (jointure "user" + profiles). */
export async function getMemberProfile(userId: string): Promise<MemberProfile | null> {
  const row = await queryOne<ProfileRow>(
    `select u.id, u.email, u.username, p.role, p.is_member, p.is_banned, p.country,
            p.phone, p.referral_code, p.games_accepted_at
       from "user" u
       join profiles p on p.id = u.id
      where u.id = $1`,
    [userId],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role === 'admin' ? 'admin' : 'user',
    isMember: row.is_member,
    isBanned: row.is_banned,
    country: row.country,
    phone: row.phone,
    referralCode: row.referral_code,
    gamesAcceptedAt: row.games_accepted_at ? row.games_accepted_at.toISOString() : null,
  };
}

/** Profil de l'utilisateur connecté (null si visiteur ou profil absent). */
export async function getCurrentProfile(): Promise<MemberProfile | null> {
  const user = await getSessionUser();
  return user ? getMemberProfile(user.id) : null;
}
