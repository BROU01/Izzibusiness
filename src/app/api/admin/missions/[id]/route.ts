import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';
import { query } from '@/lib/db';

const schema = z.object({ status: z.enum(['draft', 'open', 'closed']) });

// POST - Publier, mettre en brouillon ou clôturer une mission.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const parsed = schema.safeParse(await readJson(request));
    if (!z.uuid().safeParse(id).success || !parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Requête invalide.', 400);
    }
    await query('update missions set status = $2 where id = $1', [id, parsed.data.status]);
    return apiData({ status: parsed.data.status });
  } catch (error) {
    return internalError('admin mission status', error);
  }
}
