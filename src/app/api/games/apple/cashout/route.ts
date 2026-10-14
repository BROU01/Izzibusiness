import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { appleMultiplier } from '@/lib/games/rules';
import { loadRound, requirePlayer, roundSchema, rpcFailure, settle } from '@/lib/games/service';

// POST - Encaisse le multiplicateur de l'étage atteint.
export async function POST(request: Request) {
  try {
    const player = await requirePlayer('apple');
    if (player.response) return player.response;

    const parsed = roundSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Partie invalide.', 400);

    const round = await loadRound(player.admin, player.userId, parsed.data.roundId, 'apple');
    if (!round) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);

    const level = Number(round.public_state.level ?? 0);
    if (level < 1) {
      return apiError(ERROR_CODES.CONFLICT, 'Franchis au moins un étage avant d’encaisser.', 409);
    }

    const multiplier = appleMultiplier(level);
    const result = await settle(player.admin, round.id, 'won', multiplier, {
      ...round.public_state,
      rotten: round.secret_state.rotten,
    });
    if (!result.success) return rpcFailure(result);

    return apiData({
      outcome: 'won',
      level,
      multiplier,
      rotten: round.secret_state.rotten,
      payout: Number(result.payout),
      balance: Number(result.new_balance),
    });
  } catch (error) {
    return internalError('games apple cashout', error);
  }
}
