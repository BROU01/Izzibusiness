import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import {
  aviatorTick,
  loadRound,
  requirePlayer,
  roundSchema,
  rpcFailure,
  settle,
} from '@/lib/games/service';

/**
 * POST - Encaisse au multiplicateur calculé par le SERVEUR à l'instant de
 * réception (temps écoulé depuis started_at). Si le crash est déjà passé,
 * la partie est perdue.
 */
export async function POST(request: Request) {
  try {
    const player = await requirePlayer('aviator');
    if (player.response) return player.response;

    const parsed = roundSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Partie invalide.', 400);

    const round = await loadRound(player.userId, parsed.data.roundId, 'aviator');
    if (!round) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);
    if (round.status !== 'active') {
      return apiError(ERROR_CODES.CONFLICT, 'Cette partie est terminée.', 409);
    }

    const tick = await aviatorTick(round);
    if (tick.crashed) {
      return apiData({ outcome: 'lost', crash: tick.crash });
    }

    const crash = Number(round.secret_state.crash);
    const result = await settle(round.id, 'won', tick.current, {
      ...round.public_state,
      crash,
      cashedAt: tick.current,
    });
    if (!result.success) return rpcFailure(result);

    return apiData({
      outcome: 'won',
      multiplier: tick.current,
      crash,
      payout: Number(result.payout),
      balance: Number(result.new_balance),
    });
  } catch (error) {
    return internalError('games aviator cashout', error);
  }
}
