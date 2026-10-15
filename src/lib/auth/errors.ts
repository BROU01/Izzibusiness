import { APIError } from 'better-auth/api';

/** Code d'erreur Better Auth (ex. USER_ALREADY_EXISTS), ou null. */
export function authErrorCode(error: unknown): string | null {
  if (error instanceof APIError) {
    const body = error.body as { code?: unknown } | undefined;
    return typeof body?.code === 'string' ? body.code : null;
  }
  return null;
}
