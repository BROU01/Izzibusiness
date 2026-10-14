import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson } from '@/lib/api-response';
import { betSchema, playSpin, requirePlayer, rpcFailure } from '@/lib/games/service';

// POST - Un tour de roue : mise débitée, résultat tiré et gain crédité côté serveur.
export async function POST(request: Request) {
  try {
    const player = await requirePlayer('spin');
    if (player.response) return player.response;

    const parsed = betSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, parsed.error.issues[0].message, 400);
    }

    const spin = await playSpin(player.admin, player.userId, parsed.data.bet);
    if (!spin.result.success) return rpcFailure(spin.result);

    return apiData({
      roundId: spin.result.round_id,
      segment: spin.index,
      multiplier: spin.multiplier,
      payout: Number(spin.result.payout),
      balance: Number(spin.result.new_balance),
      serverSeedHash: spin.serverSeedHash,
    });
  } catch (error) {
    return internalError('games spin', error);
  }
}
