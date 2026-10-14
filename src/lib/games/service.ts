import { z } from 'zod';
import type { NextResponse } from 'next/server';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, asRpcResult, requireProfile, type RpcResult } from '@/lib/api-response';
import { APPLE_COLUMNS, APPLE_LEVELS, MAX_BET, MIN_BET, formatFcfa } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase/server';
import { newServerSeed } from './fair';
import {
  aviatorCrashPoint,
  aviatorMultiplierAt,
  appleMultiplier,
  appleRottenColumns,
  spinResult,
  type GameId,
} from './rules';

export const betSchema = z.object({
  bet: z.coerce
    .number('Mise invalide.')
    .int('Mise entière en FCFA.')
    .min(MIN_BET, `Mise minimale : ${formatFcfa(MIN_BET)}.`)
    .max(MAX_BET, `Mise maximale : ${formatFcfa(MAX_BET)}.`),
});

export const roundSchema = z.object({ roundId: z.uuid('Partie invalide.') });

export const pickSchema = roundSchema.extend({
  column: z.coerce
    .number()
    .int()
    .min(0)
    .max(APPLE_COLUMNS - 1),
});

type Admin = ReturnType<typeof createServiceClient>;

export async function getEnabledGames(admin: Admin): Promise<Record<GameId, boolean>> {
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'games_enabled')
    .maybeSingle();
  const value = (data?.value ?? {}) as Partial<Record<GameId, boolean>>;
  return {
    spin: value.spin === true,
    apple: value.apple === true,
    aviator: value.aviator === true,
  };
}

/**
 * Garde commune à toutes les actions de jeu : connecté, non banni,
 * adhérent, conditions acceptées (majorité + jeu responsable), jeu actif.
 */
export async function requirePlayer(
  game: GameId,
): Promise<{ userId: string; admin: Admin; response?: never } | { response: NextResponse }> {
  const auth = await requireProfile({ member: true });
  if (auth.response) return { response: auth.response };
  if (!auth.profile.gamesAcceptedAt) {
    return {
      response: apiError(
        ERROR_CODES.FORBIDDEN,
        'Confirme d’abord que tu es majeur et que tu acceptes les règles des jeux.',
        403,
      ),
    };
  }
  const admin = createServiceClient();
  const enabled = await getEnabledGames(admin);
  if (!enabled[game]) {
    return {
      response: apiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Ce jeu est temporairement fermé. Aucune mise n’a été prise.',
        503,
      ),
    };
  }
  return { userId: auth.user.id, admin };
}

export function rpcFailure(result: RpcResult): NextResponse {
  if (result.error === 'Solde insuffisant') {
    return apiError(ERROR_CODES.INSUFFICIENT_FUNDS, 'Solde insuffisant pour cette mise.', 402);
  }
  return apiError(ERROR_CODES.CONFLICT, result.error ?? 'Opération impossible.', 409);
}

// ---------------------------------------------------------------------------
// Spin & Win (instantané)
// ---------------------------------------------------------------------------

export async function playSpin(admin: Admin, userId: string, bet: number) {
  const { seed, hash } = newServerSeed();
  // La référence de tirage est la graine elle-même tirée à part : l'id de
  // partie n'existe qu'après l'insertion SQL.
  const ref = `spin:${hash.slice(0, 16)}`;
  const { index, multiplier } = spinResult(seed, ref);
  const { data, error } = await admin.rpc('play_instant_round', {
    p_user_id: userId,
    p_game: 'spin',
    p_bet: bet,
    p_multiplier: multiplier,
    p_public_state: { segment: index, ref },
    p_server_seed: seed,
    p_server_seed_hash: hash,
  });
  if (error) throw error;
  return { result: asRpcResult(data), index, multiplier, serverSeedHash: hash };
}

// ---------------------------------------------------------------------------
// Parties en plusieurs étapes (Apple Fortunes, Aviator)
// ---------------------------------------------------------------------------

export interface RoundRow {
  id: string;
  user_id: string;
  game: GameId;
  bet: number;
  status: 'active' | 'won' | 'lost';
  public_state: Record<string, unknown>;
  secret_state: Record<string, unknown>;
  server_seed_hash: string;
  version: number;
  started_at: string;
}

export async function loadRound(
  admin: Admin,
  userId: string,
  roundId: string,
  game: GameId,
): Promise<RoundRow | null> {
  const { data } = await admin
    .from('game_rounds')
    .select(
      'id, user_id, game, bet, status, public_state, secret_state, server_seed_hash, version, started_at',
    )
    .eq('id', roundId)
    .eq('user_id', userId)
    .eq('game', game)
    .maybeSingle();
  return (data as RoundRow | null) ?? null;
}

export async function openRound(
  admin: Admin,
  userId: string,
  game: 'apple' | 'aviator',
  bet: number,
) {
  const { seed, hash } = newServerSeed();
  const ref = `${game}:${hash.slice(0, 16)}`;
  const secret =
    game === 'apple'
      ? { rotten: appleRottenColumns(seed, ref) }
      : { crash: aviatorCrashPoint(seed, ref) };
  const publicState = game === 'apple' ? { level: 0, picks: [] as number[], ref } : { ref };

  const { data, error } = await admin.rpc('open_round', {
    p_user_id: userId,
    p_game: game,
    p_bet: bet,
    p_public_state: publicState,
    p_secret_state: secret,
    p_server_seed: seed,
    p_server_seed_hash: hash,
  });
  if (error) throw error;
  return { result: asRpcResult(data), serverSeedHash: hash, publicState };
}

export async function settle(
  admin: Admin,
  roundId: string,
  status: 'won' | 'lost',
  multiplier: number,
  publicState: Record<string, unknown>,
) {
  const { data, error } = await admin.rpc('settle_round', {
    p_round_id: roundId,
    p_status: status,
    p_multiplier: multiplier,
    p_public_state: publicState,
  });
  if (error) throw error;
  return asRpcResult(data);
}

/** Apple Fortunes : choix d'une case à l'étage courant. */
export async function applePick(admin: Admin, round: RoundRow, column: number) {
  const rotten = (round.secret_state.rotten ?? []) as number[];
  const level = Number(round.public_state.level ?? 0);
  const picks = (round.public_state.picks ?? []) as number[];
  const nextPicks = [...picks, column];

  if (rotten[level] === column) {
    const settled = await settle(admin, round.id, 'lost', 0, {
      ...round.public_state,
      level,
      picks: nextPicks,
      rotten,
    });
    return { outcome: 'lost' as const, level, rotten, settled };
  }

  const cleared = level + 1;
  if (cleared >= APPLE_LEVELS) {
    const multiplier = appleMultiplier(cleared);
    const settled = await settle(admin, round.id, 'won', multiplier, {
      ...round.public_state,
      level: cleared,
      picks: nextPicks,
      rotten,
    });
    return { outcome: 'completed' as const, level: cleared, multiplier, rotten, settled };
  }

  const { data: advanced } = await admin.rpc('advance_round', {
    p_round_id: round.id,
    p_expected_version: round.version,
    p_public_state: { ...round.public_state, level: cleared, picks: nextPicks },
  });
  if (advanced !== true) {
    return { outcome: 'conflict' as const, level };
  }
  return { outcome: 'safe' as const, level: cleared, multiplier: appleMultiplier(cleared) };
}

/** Aviator : état de la partie à l'instant présent (crash éventuel réglé). */
export async function aviatorTick(admin: Admin, round: RoundRow) {
  const crash = Number(round.secret_state.crash ?? 1);
  const elapsed = Date.now() - new Date(round.started_at).getTime();
  const current = aviatorMultiplierAt(elapsed);
  if (current >= crash) {
    await settle(admin, round.id, 'lost', 0, { ...round.public_state, crash });
    return { crashed: true as const, crash, current: crash };
  }
  return { crashed: false as const, current };
}
