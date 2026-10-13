/**
 * Appel JSON vers nos routes API, avec lecture uniforme des erreurs
 * `{ error: { code, message, fields? } }`.
 */
export interface ApiFailure {
  code: string;
  message: string;
  fields: Record<string, string>;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

const NETWORK_ERROR: ApiFailure = {
  code: 'network_error',
  message: 'Connexion impossible. Vérifie ton réseau et réessaie.',
  fields: {},
};

export async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  const payload: unknown = await response.json().catch(() => null);
  const record = (payload ?? {}) as Record<string, unknown>;

  if (response.ok && 'data' in record) {
    return { ok: true, data: record.data as T };
  }

  const err = (record.error ?? {}) as Record<string, unknown>;
  return {
    ok: false,
    error: {
      code: typeof err.code === 'string' ? err.code : 'unknown_error',
      message: typeof err.message === 'string' ? err.message : 'Une erreur est survenue. Réessaie.',
      fields:
        err.fields && typeof err.fields === 'object' ? (err.fields as Record<string, string>) : {},
    },
  };
}
