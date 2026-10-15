import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { betSchema, openRound, requirePlayer, rpcFailure } from '@/lib/games/service';

// POST - Ouvre une partie : la mise est débitée, l'issue est tirée et gardée secrète.
export async function POST(request: Request) {
  try {
    const player = await requirePlayer('apple');
    if (player.response) return player.response;

    const parsed = betSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const round = await openRound(player.userId, 'apple', parsed.data.bet);
    if (!round.result.success) return rpcFailure(round.result);

    return apiData({
      roundId: round.result.round_id,
      balance: Number(round.result.new_balance),
      startedAt: round.result.started_at,
      state: round.publicState,
      serverSeedHash: round.serverSeedHash,
    });
  } catch (error) {
    return internalError('games apple start', error);
  }
}
