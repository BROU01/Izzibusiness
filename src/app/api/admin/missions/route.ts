import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { requireAdmin } from '@/lib/admin-api';

const missionSchema = z.object({
  title: z.string().trim().min(5, 'Titre : 5 caractères minimum.').max(120),
  description: z.string().trim().min(10, 'Description : 10 caractères minimum.').max(2000),
  proofInstructions: z.string().trim().min(5, 'Indique quelle preuve fournir.').max(500),
  reward: z.coerce.number().int().min(1, 'Récompense positive requise.').max(1000000),
  maxCompletions: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  status: z.enum(['draft', 'open', 'closed']).default('draft'),
});

// POST - Créer une mission.
export async function POST(request: Request) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const parsed = missionSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }
    const m = parsed.data;
    const { data, error } = await guard.db
      .from('missions')
      .insert({
        title: m.title,
        description: m.description,
        proof_instructions: m.proofInstructions,
        reward: m.reward,
        max_completions: m.maxCompletions ?? null,
        status: m.status,
        created_by: guard.adminId,
      })
      .select('id')
      .single();
    if (error) return internalError('admin mission create', error);
    return apiData({ id: data.id }, 201);
  } catch (error) {
    return internalError('admin mission create', error);
  }
}
