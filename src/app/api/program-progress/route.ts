import { z } from 'zod';
import { apiData, apiError, internalError, readJson, requireUser } from '@/lib/api-response';
import { query, withTransaction } from '@/lib/db';
import { ERROR_CODES } from '@/lib/error-codes';

/**
 * Progression du programme 20 jours de l'utilisateur connecté.
 * GET  → jours complétés (avec date, pour le streak).
 * POST { day } → bascule la complétion du jour, avec verrou séquentiel :
 *   compléter le jour N exige le jour N-1 complété ; décocher est toujours permis.
 */

interface ProgressRow {
  day: number;
  completed_at: Date;
}

interface ProgressDay {
  day: number;
  completedAt: string;
}

const toggleSchema = z.object({
  day: z.number().int().min(1).max(20),
});

function toDays(rows: ProgressRow[]): ProgressDay[] {
  return rows.map((row) => ({ day: row.day, completedAt: row.completed_at.toISOString() }));
}

const SELECT_DAYS = `select day, completed_at
   from program_progress
  where user_id = $1
  order by day`;

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const rows = await query<ProgressRow>(SELECT_DAYS, [auth.user.id]);
    return apiData({ days: toDays(rows) });
  } catch (error) {
    return internalError('program-progress:get', error);
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const parsed = toggleSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Jour invalide (1 à 20).', 400);
  }
  const { day } = parsed.data;
  const userId = auth.user.id;

  try {
    const result = await withTransaction(async (client) => {
      // Sérialise les bascules d'un même utilisateur (verrou levé au COMMIT).
      await client.query('select pg_advisory_xact_lock(hashtext($1))', [
        `program_progress:${userId}`,
      ]);

      const removed = await client.query(
        'delete from program_progress where user_id = $1 and day = $2',
        [userId, day],
      );

      if ((removed.rowCount ?? 0) === 0) {
        const inserted = await client.query(
          `insert into program_progress (user_id, day)
           select $1, $2::int
            where $2::int = 1
               or exists (
                    select 1 from program_progress
                     where user_id = $1 and day = $2::int - 1
                  )
           on conflict (user_id, day) do nothing`,
          [userId, day],
        );
        if ((inserted.rowCount ?? 0) === 0) return { locked: true as const };
      }

      const rows = await client.query<ProgressRow>(SELECT_DAYS, [userId]);
      return { locked: false as const, rows: rows.rows };
    });

    if (result.locked) {
      return apiError(
        ERROR_CODES.CONFLICT,
        `Termine d’abord le jour ${day - 1} pour débloquer le jour ${day}.`,
        409,
      );
    }
    return apiData({ days: toDays(result.rows) });
  } catch (error) {
    return internalError('program-progress:post', error);
  }
}
