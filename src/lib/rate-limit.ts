import { queryOne } from './db';

/** Adresse IP du client (Vercel renseigne x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Compte une tentative pour `key`. Renvoie false quand plus de `max`
 * tentatives ont eu lieu dans la fenêtre de `windowSeconds`.
 */
export async function hitRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const row = await queryOne<{ allowed: boolean }>('select hit_rate_limit($1, $2, $3) as allowed', [
    key,
    max,
    windowSeconds,
  ]);
  return row?.allowed ?? true;
}
