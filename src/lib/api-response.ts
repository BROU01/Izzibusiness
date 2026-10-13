import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { ERROR_CODES, type ErrorCode } from './error-codes';
import { createClient } from './supabase/server';
import { SupabaseNotConfiguredError } from './supabase/env';

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
