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
import { query, queryOne } from '@/lib/db';
import { getEnabledGames } from '@/lib/games/service';
import { APPLE_MULTIPLIERS, SPIN_SEGMENTS } from '@/lib/games/rules';

interface ActiveRoundRow {
  id: string;
  game: string;
  bet: number;
  public_state: Record<string, unknown>;
  server_seed_hash: string;
  started_at: Date;
}

interface RecentRoundRow {
  id: string;
  game: string;
  bet: number;
  status: string;
  multiplier: number;
  payout: number;
  started_at: Date;
}

/** État des jeux pour le joueur : règles, jeux ouverts, parties en cours, solde. */
export async function GET() {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Jamais de secret_state ni de server_seed pour une partie en cours.
    const [enabled, wallet, active, recent] = await Promise.all([
      getEnabledGames(),
      queryOne<{ balance: number }>(
        'select balance::float8 as balance from wallets where user_id = $1',
        [userId],
      ),
      query<ActiveRoundRow>(
        `select id, game, bet::float8 as bet, public_state, server_seed_hash, started_at
           from game_rounds
          where user_id = $1 and status = 'active'`,
        [userId],
      ),
      query<RecentRoundRow>(
        `select id, game, bet::float8 as bet, status, multiplier::float8 as multiplier,
                payout::float8 as payout, started_at
           from game_rounds
          where user_id = $1 and status <> 'active'
          order by started_at desc
          limit 10`,
        [userId],
      ),
    ]);

    return apiData({
      isMember: auth.profile.isMember,
      accepted: Boolean(auth.profile.gamesAcceptedAt),
      balance: Number(wallet?.balance ?? 0),
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
      active: active.map((r) => ({
        id: r.id,
        game: r.game,
        bet: Number(r.bet),
        state: r.public_state,
        serverSeedHash: r.server_seed_hash,
        startedAt: r.started_at.toISOString(),
      })),
      recent: recent.map((r) => ({
        id: r.id,
        game: r.game,
        bet: Number(r.bet),
        status: r.status,
        multiplier: Number(r.multiplier),
        payout: Number(r.payout),
        startedAt: r.started_at.toISOString(),
      })),
    });
  } catch (error) {
    return internalError('games GET', error);
  }
}
