import { z } from 'zod';
import type { NextResponse } from 'next/server';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiError, asRpcResult, requireProfile, type RpcResult } from '@/lib/api-response';
import { APPLE_COLUMNS, APPLE_LEVELS, MAX_BET, MIN_BET, formatFcfa } from '@/lib/config';
import { callFunction, queryOne } from '@/lib/db';
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

export async function getEnabledGames(): Promise<Record<GameId, boolean>> {
  const row = await queryOne<{ value: Partial<Record<GameId, boolean>> }>(
    "select value from app_settings where key = 'games_enabled'",
  );
  const value = row?.value ?? {};
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
): Promise<{ userId: string; response?: never } | { userId?: never; response: NextResponse }> {
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
  const enabled = await getEnabledGames();
  if (!enabled[game]) {
    return {
      response: apiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Ce jeu est temporairement fermé. Aucune mise n’a été prise.',
        503,
      ),
    };
  }
  return { userId: auth.user.id };
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

export async function playSpin(userId: string, bet: number) {
  const { seed, hash } = newServerSeed();
  // La référence de tirage est la graine elle-même tirée à part : l'id de
  // partie n'existe qu'après l'insertion SQL.
  const ref = `spin:${hash.slice(0, 16)}`;
  const { index, multiplier } = spinResult(seed, ref);
  const data = await callFunction('play_instant_round', [
    userId,
    'spin',
    bet,
    multiplier,
    JSON.stringify({ segment: index, ref }),
    seed,
    hash,
  ]);
  return { result: asRpcResult(data), index, multiplier, serverSeedHash: hash };
}

// ---------------------------------------------------------------------------
// Parties en plusieurs étapes (Apple Fortunes, Aviator)
// ---------------------------------------------------------------------------

export interface RoundRow {
  id: string;
  user_id: string;
  game: GameId;
  /** numeric renvoyé en texte par pg. */
  bet: string;
  status: 'active' | 'won' | 'lost';
  public_state: Record<string, unknown>;
  secret_state: Record<string, unknown>;
  server_seed_hash: string;
  version: number;
  started_at: Date;
}

export async function loadRound(
  userId: string,
  roundId: string,
  game: GameId,
): Promise<RoundRow | null> {
  return queryOne<RoundRow>(
    `select id, user_id, game, bet, status, public_state, secret_state, server_seed_hash,
            version, started_at
       from game_rounds
      where id = $1 and user_id = $2 and game = $3`,
    [roundId, userId, game],
  );
}

export async function openRound(userId: string, game: 'apple' | 'aviator', bet: number) {
  const { seed, hash } = newServerSeed();
  const ref = `${game}:${hash.slice(0, 16)}`;
  const secret =
    game === 'apple'
      ? { rotten: appleRottenColumns(seed, ref) }
      : { crash: aviatorCrashPoint(seed, ref) };
  const publicState = game === 'apple' ? { level: 0, picks: [] as number[], ref } : { ref };

  const data = await callFunction('open_round', [
    userId,
    game,
    bet,
    JSON.stringify(publicState),
    JSON.stringify(secret),
    seed,
    hash,
  ]);
  return { result: asRpcResult(data), serverSeedHash: hash, publicState };
}

export async function settle(
  roundId: string,
  status: 'won' | 'lost',
  multiplier: number,
  publicState: Record<string, unknown>,
) {
  const data = await callFunction('settle_round', [
    roundId,
    status,
    multiplier,
    JSON.stringify(publicState),
  ]);
  return asRpcResult(data);
}

/** Apple Fortunes : choix d'une case à l'étage courant. */
export async function applePick(round: RoundRow, column: number) {
  const rotten = (round.secret_state.rotten ?? []) as number[];
  const level = Number(round.public_state.level ?? 0);
  const picks = (round.public_state.picks ?? []) as number[];
  const nextPicks = [...picks, column];

  if (rotten[level] === column) {
    const settled = await settle(round.id, 'lost', 0, {
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
    const settled = await settle(round.id, 'won', multiplier, {
      ...round.public_state,
      level: cleared,
      picks: nextPicks,
      rotten,
    });
    return { outcome: 'completed' as const, level: cleared, multiplier, rotten, settled };
  }

  const advanced = await callFunction<boolean>('advance_round', [
    round.id,
    round.version,
    JSON.stringify({ ...round.public_state, level: cleared, picks: nextPicks }),
  ]);
  if (advanced !== true) {
    return { outcome: 'conflict' as const, level };
  }
  return { outcome: 'safe' as const, level: cleared, multiplier: appleMultiplier(cleared) };
}

/** Aviator : état de la partie à l'instant présent (crash éventuel réglé). */
export async function aviatorTick(round: RoundRow) {
  const crash = Number(round.secret_state.crash ?? 1);
  const elapsed = Date.now() - new Date(round.started_at).getTime();
  const current = aviatorMultiplierAt(elapsed);
  if (current >= crash) {
    await settle(round.id, 'lost', 0, { ...round.public_state, crash });
    return { crashed: true as const, crash, current: crash };
  }
  return { crashed: false as const, current };
}
