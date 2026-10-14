import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';

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

    const { error } = await guard.db.from('app_settings').upsert({
      key: 'games_enabled',
      value: parsed.data.enabled,
      updated_at: new Date().toISOString(),
      updated_by: guard.adminId,
    });
    if (error) return internalError('admin games', error);
    return apiData(parsed.data);
  } catch (error) {
    return internalError('admin games', error);
  }
}
