import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { ERROR_CODES, type ErrorCode } from './error-codes';
import { createClient } from './supabase/server';
import { SupabaseNotConfiguredError } from './supabase/env';
import { PaydunyaNotConfiguredError } from './paydunya';

export function apiError(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function serviceUnavailable() {
  return apiError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    'Service temporairement indisponible. Réessaie dans quelques minutes.',
    503,
  );
}

/** Erreur inattendue : journalisée côté serveur, jamais renvoyée telle quelle. */
export function internalError(scope: string, error: unknown) {
  if (error instanceof SupabaseNotConfiguredError) return serviceUnavailable();
  if (error instanceof PaydunyaNotConfiguredError) {
    return apiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Les paiements Mobile Money ne sont pas encore activés. Aucun montant n’a été débité.',
      503,
    );
  }
  console.error(`[${scope}]`, error);
  return apiError(ERROR_CODES.INTERNAL, 'Erreur interne. Réessaie plus tard.', 500);
}

/** Lit le body JSON sans lever d'exception (null si invalide). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Utilisateur authentifié de la requête, vérifié auprès de Supabase Auth
 * (getUser revalide le jeton, contrairement à getSession).
 */
export async function requireUser(): Promise<
  | { user: User; supabase: Awaited<ReturnType<typeof createClient>>; response?: never }
  | { user?: never; supabase?: never; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: apiError(ERROR_CODES.UNAUTHORIZED, 'Connecte-toi pour continuer.', 401),
    };
  }
  return { user, supabase };
}

export interface MemberProfile {
  id: string;
  username: string | null;
  role: 'user' | 'admin';
  isMember: boolean;
  isBanned: boolean;
  country: string | null;
  phone: string | null;
  gamesAcceptedAt: string | null;
}

/**
 * Utilisateur connecté + profil. Refuse les comptes bannis (403) et, si
 * `member` est demandé, les comptes sans adhésion (403).
 */
export async function requireProfile(options: { member?: boolean; admin?: boolean } = {}): Promise<
  | {
      user: User;
      profile: MemberProfile;
      supabase: Awaited<ReturnType<typeof createClient>>;
      response?: never;
    }
  | { user?: never; profile?: never; supabase?: never; response: NextResponse }
> {
  const auth = await requireUser();
  if (auth.response) return { response: auth.response };

  const { data } = await auth.supabase
    .from('profiles')
    .select('id, username, role, is_member, is_banned, country, phone, games_accepted_at')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!data) {
    return { response: apiError(ERROR_CODES.FORBIDDEN, 'Profil introuvable.', 403) };
  }

  const profile: MemberProfile = {
    id: data.id,
    username: data.username ?? null,
    role: data.role === 'admin' ? 'admin' : 'user',
    isMember: data.is_member === true,
    isBanned: data.is_banned === true,
    country: data.country ?? null,
    phone: data.phone ?? null,
    gamesAcceptedAt: data.games_accepted_at ?? null,
  };

  if (profile.isBanned) {
    return {
      response: apiError(
        ERROR_CODES.FORBIDDEN,
        'Ce compte est suspendu. Contacte le support.',
        403,
      ),
    };
  }
  if (options.admin && profile.role !== 'admin') {
    return { response: apiError(ERROR_CODES.FORBIDDEN, 'Accès réservé à l’administration.', 403) };
  }
  if (options.member && !profile.isMember) {
    return {
      response: apiError(
        ERROR_CODES.FORBIDDEN,
        'Cette action est réservée aux adhérents. Règle ton adhésion depuis ton wallet.',
        403,
      ),
    };
  }

  return { user: auth.user, profile, supabase: auth.supabase };
}

/** Résultat d'une fonction SQL d'argent : `{ success, error?, ... }`. */
export interface RpcResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export function asRpcResult(data: unknown): RpcResult {
  if (data && typeof data === 'object' && 'success' in data) return data as RpcResult;
  return { success: false, error: 'Réponse inattendue' };
}
