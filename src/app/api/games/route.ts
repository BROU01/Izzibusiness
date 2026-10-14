import { apiData, internalError, requireProfile } from '@/lib/api-response';
import {
  APPLE_COLUMNS,
  APPLE_LEVELS,
  AVIATOR_GROWTH_RATE,
  AVIATOR_MAX_MULTIPLIER,
  GAME_RTP,
  MAX_BET,
  MIN_BET,
} from '@/lib/config';
import { createServiceClient } from '@/lib/supabase/server';
import { getEnabledGames } from '@/lib/games/service';
import { APPLE_MULTIPLIERS, SPIN_SEGMENTS } from '@/lib/games/rules';

/** État des jeux pour le joueur : règles, jeux ouverts, parties en cours, solde. */
export async function GET() {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    const [enabled, wallet, active, recent] = await Promise.all([
      getEnabledGames(createServiceClient()),
      auth.supabase.from('wallets').select('balance').eq('user_id', auth.user.id).maybeSingle(),
      auth.supabase
        .from('game_rounds')
        .select('id, game, bet, public_state, server_seed_hash, started_at')
        .eq('user_id', auth.user.id)
        .eq('status', 'active'),
      auth.supabase
        .from('game_rounds')
        .select('id, game, bet, status, multiplier, payout, started_at')
        .eq('user_id', auth.user.id)
        .neq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(10),
    ]);

    return apiData({
      isMember: auth.profile.isMember,
      accepted: Boolean(auth.profile.gamesAcceptedAt),
      balance: Number(wallet.data?.balance ?? 0),
      enabled,
      rules: {
        minBet: MIN_BET,
        maxBet: MAX_BET,
        rtp: GAME_RTP,
        spinSegments: SPIN_SEGMENTS,
        appleLevels: APPLE_LEVELS,
        appleColumns: APPLE_COLUMNS,
        appleMultipliers: APPLE_MULTIPLIERS,
        aviatorGrowthRate: AVIATOR_GROWTH_RATE,
        aviatorMaxMultiplier: AVIATOR_MAX_MULTIPLIER,
      },
      active: (active.data ?? []).map((r) => ({
        id: r.id,
        game: r.game,
        bet: Number(r.bet),
        state: r.public_state,
        serverSeedHash: r.server_seed_hash,
        startedAt: r.started_at,
      })),
      recent: (recent.data ?? []).map((r) => ({
        id: r.id,
        game: r.game,
        bet: Number(r.bet),
        status: r.status,
        multiplier: Number(r.multiplier),
        payout: Number(r.payout),
        startedAt: r.started_at,
      })),
    });
  } catch (error) {
    return internalError('games GET', error);
  }
}
