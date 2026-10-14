import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError } from '@/lib/api-response';
import { aviatorTick, loadRound, requirePlayer, roundSchema } from '@/lib/games/service';

/** GET - Le vol est-il terminé ? Révèle le point de crash seulement une fois atteint. */
export async function GET(request: Request) {
  try {
    const player = await requirePlayer('aviator');
    if (player.response) return player.response;

    const parsed = roundSchema.safeParse({
      roundId: new URL(request.url).searchParams.get('roundId'),
    });
    if (!parsed.success) return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Partie invalide.', 400);

    const round = await loadRound(player.admin, player.userId, parsed.data.roundId, 'aviator');
    if (!round) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);
    if (round.status !== 'active') {
      return apiData({ status: round.status, crash: round.public_state.crash ?? null });
    }

    const tick = await aviatorTick(player.admin, round);
    return tick.crashed
      ? apiData({ status: 'lost', crash: tick.crash })
      : apiData({ status: 'active', current: tick.current });
  } catch (error) {
    return internalError('games aviator status', error);
  }
}
