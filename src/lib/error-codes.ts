/**
 * Codes d'erreur renvoyés par les routes API : `{ error: { code, message } }`.
 * Le code est stable (le client peut le tester), le message est affichable.
 */
export const ERROR_CODES = {
  INVALID_PAYLOAD: 'invalid_payload',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  RATE_LIMITED: 'rate_limited',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  INTERNAL: 'internal_error',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiError {
  error: { code: ErrorCode; message: string };
}
