import { NextResponse } from 'next/server';
import { ERROR_CODES, type ErrorCode } from './error-codes';
import { DatabaseNotConfiguredError, queryOne } from './db';
import { getMemberProfile, getSessionUser, type MemberProfile, type SessionUser } from './session';
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
  if (error instanceof DatabaseNotConfiguredError) return serviceUnavailable();
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

/** Utilisateur connecté (session Better Auth vérifiée côté serveur), sinon 401. */
export async function requireUser(): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      response: apiError(ERROR_CODES.UNAUTHORIZED, 'Connecte-toi pour continuer.', 401),
    };
  }
  // La session est mise en cache 5 min dans le cookie : le bannissement est
  // revérifié en base à chaque appel.
  const banned = await queryOne<{ is_banned: boolean }>(
    'select is_banned from profiles where id = $1',
    [user.id],
  );
  if (banned?.is_banned) {
    return {
      response: apiError(
        ERROR_CODES.FORBIDDEN,
        'Ce compte est suspendu. Contacte le support.',
        403,
      ),
    };
  }
  return { user };
}

export type { MemberProfile };

/**
 * Utilisateur connecté + profil lu en base. Refuse les comptes bannis (403),
 * et selon les options les non-admins ou les comptes sans adhésion (403).
 */
export async function requireProfile(
  options: { member?: boolean; admin?: boolean } = {},
): Promise<
  | { user: SessionUser; profile: MemberProfile; response?: never }
  | { user?: never; profile?: never; response: NextResponse }
> {
  const auth = await requireUser();
  if (auth.response) return { response: auth.response };

  const profile = await getMemberProfile(auth.user.id);
  if (!profile) {
    return { response: apiError(ERROR_CODES.FORBIDDEN, 'Profil introuvable.', 403) };
  }
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

  return { user: auth.user, profile };
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
