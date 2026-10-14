import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, requireUser } from '@/lib/api-response';
import { createServiceClient } from '@/lib/supabase/server';

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

    const { data } = await createServiceClient()
      .from('game_rounds')
      .select(
        'id, game, bet, status, multiplier, payout, public_state, server_seed, server_seed_hash, started_at, settled_at',
      )
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (!data) return apiError(ERROR_CODES.NOT_FOUND, 'Partie introuvable.', 404);

    return apiData({
      ...data,
      bet: Number(data.bet),
      multiplier: Number(data.multiplier),
      payout: Number(data.payout),
      // Graine révélée uniquement après la fin de la partie.
      server_seed: data.status === 'active' ? null : data.server_seed,
    });
  } catch (error) {
    return internalError('games round GET', error);
  }
}
