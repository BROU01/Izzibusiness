/**
 * Règles métier de la plateforme — source de vérité unique.
 * Ne pas coder ces montants en dur dans les composants :
 * importer depuis ce fichier.
 */

/** Frais d'adhésion à l'inscription (FCFA). */
export const ADHESION_FEE = 4000;

/** Montant minimum de retrait (FCFA). */
export const MIN_WITHDRAWAL = 5000;

/** Bonus crédit au parrain pour chaque filleul actif (FCFA). */
export const REFERRAL_BONUS = 1000;

/** Frais de retrait, en part du montant (0.02 = 2 %). */
export const WITHDRAWAL_FEE_RATE = 0.02;

/** Montant minimum de dépôt (FCFA). */
export const MIN_DEPOSIT = 100;

/** Formatage monétaire : "4 000 FCFA". */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

// ---------------------------------------------------------------------------
// Jeux à mises réelles
// ---------------------------------------------------------------------------

/** Mise minimale et maximale par partie (FCFA). */
export const MIN_BET = 50;
export const MAX_BET = 50000;

/**
 * Taux de retour au joueur (0.95 = sur la durée, 95 % des mises sont
 * redistribuées). Sert à calculer les multiplicateurs de chaque jeu.
 */
export const GAME_RTP = 0.95;

/** Aviator : multiplicateur maximal et vitesse de montée (m = e^(k·t), t en s). */
export const AVIATOR_MAX_MULTIPLIER = 100;
export const AVIATOR_GROWTH_RATE = 0.08;

/** Apple Fortunes : nombre d'étages et de cases par étage (une pomme pourrie par étage). */
export const APPLE_LEVELS = 8;
export const APPLE_COLUMNS = 4;

// ---------------------------------------------------------------------------
// Mobile Money (PayDunya)
// ---------------------------------------------------------------------------

/**
 * Opérateurs proposés pour les retraits, par pays, avec le `withdraw_mode`
 * attendu par l'API de déboursement PayDunya. À vérifier dans le tableau
 * de bord PayDunya (rubrique Déboursement) avant la mise en production.
 */
export const WITHDRAW_OPERATORS: Record<string, { mode: string; label: string }[]> = {
  BJ: [
    { mode: 'mtn-benin', label: 'MTN MoMo' },
    { mode: 'moov-benin', label: 'Moov Money' },
  ],
  TG: [
    { mode: 't-money-togo', label: 'T-Money' },
    { mode: 'moov-togo', label: 'Moov Money' },
  ],
  CI: [
    { mode: 'orange-money-ci', label: 'Orange Money' },
    { mode: 'mtn-ci', label: 'MTN MoMo' },
    { mode: 'moov-ci', label: 'Moov Money' },
    { mode: 'wave-ci', label: 'Wave' },
  ],
  SN: [
    { mode: 'orange-money-senegal', label: 'Orange Money' },
    { mode: 'free-money-senegal', label: 'Free Money' },
    { mode: 'wave-senegal', label: 'Wave' },
  ],
  ML: [{ mode: 'orange-money-mali', label: 'Orange Money' }],
  BF: [
    { mode: 'orange-money-burkina', label: 'Orange Money' },
    { mode: 'moov-burkina-faso', label: 'Moov Money' },
  ],
};

/** Montant maximal d'un dépôt en une fois (FCFA). */
export const MAX_DEPOSIT = 1000000;
