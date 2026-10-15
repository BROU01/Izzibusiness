import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { applePick, loadRound, pickSchema, requirePlayer } from '@/lib/games/service';

// POST - Révèle une case de l'étage courant.
export async function POST(request: Request) {
  try {
    const player = await requirePlayer('apple');
    if (player.response) return player.response;

    const parsed = pickSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Case invalide.', 400);
    }

    const round = await loadRound(player.userId, parsed.data.roundId, 'apple');
    if (!round) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);
    if (round.status !== 'active') {
      return apiError(ERROR_CODES.CONFLICT, 'Cette partie est terminée.', 409);
    }

    const result = await applePick(round, parsed.data.column);
    if (result.outcome === 'conflict') {
      return apiError(
        ERROR_CODES.CONFLICT,
        'Action déjà prise en compte, recharge la partie.',
        409,
      );
    }
    if (result.outcome === 'lost') {
      return apiData({ outcome: 'lost', level: result.level, rotten: result.rotten });
    }
    if (result.outcome === 'completed') {
      return apiData({
        outcome: 'won',
        level: result.level,
        multiplier: result.multiplier,
        rotten: result.rotten,
        payout: Number(result.settled.payout),
        balance: Number(result.settled.new_balance),
      });
    }
    return apiData({ outcome: 'safe', level: result.level, multiplier: result.multiplier });
  } catch (error) {
    return internalError('games apple pick', error);
  }
}
