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
