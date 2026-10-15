import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, requireUser } from '@/lib/api-response';
import { queryOne } from '@/lib/db';

interface RoundDetailRow {
  id: string;
  game: string;
  bet: number;
  status: string;
  multiplier: number;
  payout: number;
  public_state: Record<string, unknown>;
  server_seed: string | null;
  server_seed_hash: string;
  started_at: Date;
  settled_at: Date | null;
}

/**
 * GET - Détail vérifiable d'une partie terminée : la graine serveur est
 * révélée pour que le joueur recalcule le tirage (voir lib/games/fair.ts).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Partie invalide.', 400);
    }

    // Graine révélée uniquement après la fin de la partie (filtrée en SQL).
    const data = await queryOne<RoundDetailRow>(
      `select id, game, bet::float8 as bet, status, multiplier::float8 as multiplier,
              payout::float8 as payout, public_state,
              case when status = 'active' then null else server_seed end as server_seed,
              server_seed_hash, started_at, settled_at
         from game_rounds
        where id = $1 and user_id = $2`,
      [id, auth.user.id],
    );
    if (!data) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);

    return apiData({
      ...data,
      bet: Number(data.bet),
      multiplier: Number(data.multiplier),
      payout: Number(data.payout),
      server_seed: data.status === 'active' ? null : data.server_seed,
      started_at: data.started_at.toISOString(),
      settled_at: data.settled_at ? data.settled_at.toISOString() : null,
    });
  } catch (error) {
    return internalError('games round GET', error);
  }
}
