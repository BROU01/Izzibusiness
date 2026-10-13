import { ERROR_CODES } from './error-codes';
import { apiError } from './api-response';

/**
 * Les flux d'argent (dépôt, retrait, adhésion) sont suspendus tant que
 * l'intégration PayDunya (IPN signée + confirmation serveur) n'est pas en
 * place. L'ancien flux Kkiapay créditait le wallet sur simple POST non signé.
 */
export function paymentsUnavailable() {
  return apiError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    'Les paiements Mobile Money arrivent bientôt via PayDunya. Aucun montant n’a été débité.',
    503,
  );
}
