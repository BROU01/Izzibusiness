import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireProfile } from '@/lib/api-response';
import { query, queryOne } from '@/lib/db';

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

    const mission = await queryOne<{ id: string; status: string; max_completions: number | null }>(
      'select id, status, max_completions from missions where id = $1',
      [id],
    );
    if (!mission || mission.status !== 'open') {
      return apiError(ERROR_CODES.NOT_FOUND, 'Cette mission n’est plus ouverte.', 404);
    }
    if (mission.max_completions) {
      const approved = await queryOne<{ count: number }>(
        `select count(*)::int as count
           from mission_submissions
          where mission_id = $1 and status = 'approved'`,
        [id],
      );
      if ((approved?.count ?? 0) >= mission.max_completions) {
        return apiError(ERROR_CODES.CONFLICT, 'Cette mission est complète.', 409);
      }
    }

    try {
      await query(
        'insert into mission_submissions (mission_id, user_id, proof) values ($1, $2, $3)',
        [id, auth.user.id, parsed.data.proof],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return apiError(ERROR_CODES.CONFLICT, 'Tu as déjà soumis cette mission.', 409);
      }
      throw error;
    }
    return apiData({ status: 'pending' }, 201);
  } catch (error) {
    return internalError('mission submit', error);
  }
}

/** Code PostgreSQL 23505 : contrainte d'unicité (mission_id, user_id). */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}
