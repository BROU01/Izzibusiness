import { createHash, createHmac, randomBytes } from 'node:crypto';

/**
 * Tirage vérifiable (« provably fair ») :
 * - une graine serveur secrète est tirée à l'ouverture de la partie ;
 * - son empreinte SHA-256 est montrée au joueur AVANT le résultat ;
 * - la graine est révélée après la partie : le joueur peut recalculer
 *   HMAC-SHA256(graine, "<id de partie>:<index>") et vérifier le tirage.
 */
export function newServerSeed(): { seed: string; hash: string } {
  const seed = randomBytes(32).toString('hex');
  return { seed, hash: createHash('sha256').update(seed).digest('hex') };
}

/** Nombre uniforme dans [0, 1) dérivé de la graine (52 bits de précision). */
export function fairFloat(seed: string, label: string, index: number): number {
  const digest = createHmac('sha256', seed).update(`${label}:${index}`).digest();
  // 13 caractères hexadécimaux = 52 bits, exactement représentables en double.
  const int = parseInt(digest.toString('hex').slice(0, 13), 16);
  return int / 2 ** 52;
}

/** Entier uniforme dans [0, max). */
export function fairInt(seed: string, label: string, index: number, max: number): number {
  return Math.floor(fairFloat(seed, label, index) * max);
}

export function floor2(value: number): number {
  return Math.floor(value * 100) / 100;
}
