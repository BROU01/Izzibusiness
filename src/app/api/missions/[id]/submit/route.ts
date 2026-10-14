import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireProfile } from '@/lib/api-response';
import { createServiceClient } from '@/lib/supabase/server';

const schema = z.object({
  proof: z
    .string('Décris ta preuve.')
    .trim()
    .min(5, 'Preuve trop courte (5 caractères minimum).')
    .max(1000, 'Preuve trop longue (1 000 caractères maximum).'),
});

// POST - Soumettre la preuve d'une mission (adhérents, une fois par mission).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireProfile({ member: true });
    if (auth.response) return auth.response;

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Mission invalide.', 400);
    }
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const admin = createServiceClient();
    const { data: mission } = await admin
      .from('missions')
      .select('id, status, max_completions')
      .eq('id', id)
      .maybeSingle();
    if (!mission || mission.status !== 'open') {
      return apiError(ERROR_CODES.NOT_FOUND, 'Cette mission n’est plus ouverte.', 404);
    }
    if (mission.max_completions) {
      const { count } = await admin
        .from('mission_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('mission_id', id)
        .eq('status', 'approved');
      if ((count ?? 0) >= mission.max_completions) {
        return apiError(ERROR_CODES.CONFLICT, 'Cette mission est complète.', 409);
      }
    }

    const { error } = await admin.from('mission_submissions').insert({
      mission_id: id,
      user_id: auth.user.id,
      proof: parsed.data.proof,
    });
    if (error) {
      if (error.code === '23505') {
        return apiError(ERROR_CODES.CONFLICT, 'Tu as déjà soumis cette mission.', 409);
      }
      return internalError('mission submit', error);
    }
    return apiData({ status: 'pending' }, 201);
  } catch (error) {
    return internalError('mission submit', error);
  }
}
