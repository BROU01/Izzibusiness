import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';

const schema = z.object({ status: z.enum(['new', 'in_progress', 'resolved']) });

// POST - Statut d'un message de contact.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;
    const { id } = await context.params;
    const parsed = schema.safeParse(await readJson(request));
    if (!z.uuid().safeParse(id).success || !parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Requête invalide.', 400);
    }
    const { error } = await guard.db
      .from('contact_messages')
      .update({ status: parsed.data.status })
      .eq('id', id);
    if (error) return internalError('admin message', error);
    return apiData(parsed.data);
  } catch (error) {
    return internalError('admin message', error);
  }
}
