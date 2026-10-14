import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';

const schema = z.object({
  title: z.string().trim().min(3, 'Titre : 3 caractères minimum.').max(120),
  message: z.string().trim().min(5, 'Message : 5 caractères minimum.').max(1000),
  audience: z.enum(['all', 'members']),
});

const BATCH = 500;

// POST - Annonce envoyée dans les notifications de tous les comptes (ou des adhérents).
export async function POST(request: Request) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    let query = guard.db.from('profiles').select('id').eq('is_banned', false);
    if (parsed.data.audience === 'members') query = query.eq('is_member', true);
    const { data: recipients, error } = await query;
    if (error) return internalError('admin broadcast', error);

    const rows = (recipients ?? []).map((r) => ({
      user_id: r.id,
      title: parsed.data.title,
      message: parsed.data.message,
      type: 'info',
    }));
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error: insertError } = await guard.db
        .from('notifications')
        .insert(rows.slice(i, i + BATCH));
      if (insertError) return internalError('admin broadcast insert', insertError);
    }
    return apiData({ sent: rows.length });
  } catch (error) {
    return internalError('admin broadcast', error);
  }
}
