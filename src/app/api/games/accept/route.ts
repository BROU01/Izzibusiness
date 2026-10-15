import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireProfile } from '@/lib/api-response';
import { query } from '@/lib/db';

const schema = z.object({
  adult: z.literal(true, 'Les jeux sont réservés aux personnes majeures.'),
  rules: z.literal(true, 'Tu dois accepter les règles des jeux.'),
});

// POST - Confirmation de majorité et acceptation des règles (une fois).
export async function POST(request: Request) {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    await query(
      `update profiles set games_accepted_at = now()
        where id = $1 and games_accepted_at is null`,
      [auth.user.id],
    );
    return apiData({ accepted: true });
  } catch (error) {
    return internalError('games accept', error);
  }
}
