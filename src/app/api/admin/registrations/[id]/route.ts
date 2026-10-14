import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';

const schema = z.object({ status: z.enum(['new', 'contacted', 'enrolled', 'cancelled']) });

// POST - Suivi d'une demande d'inscription à une formation.
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
      .from('course_registrations')
      .update({ status: parsed.data.status })
      .eq('id', id);
    if (error) return internalError('admin registration', error);
    return apiData(parsed.data);
  } catch (error) {
    return internalError('admin registration', error);
  }
}
