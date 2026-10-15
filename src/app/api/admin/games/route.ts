import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { query } from '@/lib/db';

const schema = z.object({
  enabled: z.object({ spin: z.boolean(), apple: z.boolean(), aviator: z.boolean() }),
});

// POST - Ouvre ou ferme chaque jeu (effet immédiat sur les nouvelles mises).
export async function POST(request: Request) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Réglage invalide.', 400);

    await query(
      `insert into app_settings (key, value, updated_at, updated_by)
       values ('games_enabled', $1::jsonb, now(), $2)
       on conflict (key) do update
         set value = excluded.value, updated_at = excluded.updated_at,
             updated_by = excluded.updated_by`,
      [JSON.stringify(parsed.data.enabled), guard.adminId],
    );
    return apiData(parsed.data);
  } catch (error) {
    return internalError('admin games', error);
  }
}
