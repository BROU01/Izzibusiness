import {
  APPLE_COLUMNS,
  APPLE_LEVELS,
  AVIATOR_GROWTH_RATE,
  AVIATOR_MAX_MULTIPLIER,
  GAME_RTP,
} from '@/lib/config';
import { fairFloat, fairInt, floor2 } from './fair';

export type GameId = 'spin' | 'apple' | 'aviator';
export const GAME_IDS: GameId[] = ['spin', 'apple', 'aviator'];

export const GAME_NAMES: Record<GameId, string> = {
  spin: 'Spin & Win',
  apple: 'Apple Fortunes',
  aviator: 'Aviator',
};

// ---------------------------------------------------------------------------
// Spin & Win : 20 cases équiprobables, somme des multiplicateurs = 19
// → retour joueur 19 / 20 = 95 %.
// ---------------------------------------------------------------------------
export const SPIN_SEGMENTS: readonly number[] = [
  0, 0.5, 0, 1.5, 0, 2, 0.5, 0, 1, 5, 0, 0.5, 0, 2, 1.5, 0, 3, 0.5, 0, 1,
];

export function spinResult(seed: string, roundRef: string): { index: number; multiplier: number } {
  const index = fairInt(seed, roundRef, 0, SPIN_SEGMENTS.length);
  return { index, multiplier: SPIN_SEGMENTS[index] };
}

// ---------------------------------------------------------------------------
// Apple Fortunes : APPLE_LEVELS étages, APPLE_COLUMNS cases, une pomme
// pourrie par étage. Survie à un étage : (C-1)/C. Multiplicateur après k
// étages réussis = RTP × (C/(C-1))^k → espérance = RTP quel que soit le
// moment de l'encaissement.
// ---------------------------------------------------------------------------
export function appleMultiplier(levelsCleared: number): number {
  if (levelsCleared <= 0) return 0;
  return floor2(GAME_RTP * (APPLE_COLUMNS / (APPLE_COLUMNS - 1)) ** levelsCleared);
}

export const APPLE_MULTIPLIERS: number[] = Array.from({ length: APPLE_LEVELS }, (_, i) =>
  appleMultiplier(i + 1),
);

/** Position de la pomme pourrie à chaque étage (secret jusqu'à la fin). */
export function appleRottenColumns(seed: string, roundRef: string): number[] {
  return Array.from({ length: APPLE_LEVELS }, (_, level) =>
    fairInt(seed, roundRef, level, APPLE_COLUMNS),
  );
}

// ---------------------------------------------------------------------------
// Aviator : point de crash = RTP / (1 - u), plafonné. P(crash ≥ m) = RTP/m,
// donc encaisser à m rapporte en moyenne m × RTP/m = RTP.
// Le multiplicateur affiché monte en m(t) = e^(k·t).
// ---------------------------------------------------------------------------
export function aviatorCrashPoint(seed: string, roundRef: string): number {
  const u = fairFloat(seed, roundRef, 0);
  const crash = floor2(GAME_RTP / (1 - u));
  return Math.min(Math.max(crash, 1), AVIATOR_MAX_MULTIPLIER);
}

export function aviatorMultiplierAt(elapsedMs: number): number {
  const seconds = Math.max(0, elapsedMs) / 1000;
  return Math.min(floor2(Math.exp(AVIATOR_GROWTH_RATE * seconds)), AVIATOR_MAX_MULTIPLIER);
}

/** Temps (ms) nécessaire pour atteindre un multiplicateur. */
export function aviatorTimeFor(multiplier: number): number {
  return (Math.log(multiplier) / AVIATOR_GROWTH_RATE) * 1000;
}
