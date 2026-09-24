---
description: Règles obligatoires pour tout flux de paiement, dépôt ou retrait
globs:
  - 'src/app/api/**/route.ts'
  - 'src/lib/kkiapay.ts'
  - 'src/lib/beem.ts'
  - 'src/lib/pawapay.ts'
alwaysApply: false
---

# Paiements

## Providers

| Provider | Usage                       | Fichiers                                             |
| -------- | --------------------------- | ---------------------------------------------------- |
| Kkiapay  | Dépôts carte / mobile money | `src/lib/kkiapay.ts`, `src/app/api/kkiapay/*`        |
| Beem     | Dépôts mobile money (Bénin) | `src/lib/beem.ts`, `src/app/api/wallet/beem/*`       |
| PawaPay  | Retraits mobile money       | `src/lib/pawapay.ts`, `src/app/api/wallet/pawapay/*` |

## Règles

1. Vérifier la signature côté serveur avant tout crédit (voir `POST /api/kkiapay/verify`).
2. Toute transaction doit être idempotente : une clé unique (`reference` ou `transaction_id`)
   empêche le double crédit.
3. Le solde se met à jour dans une transaction SQL (`supabase.rpc` ou
   `update ... where` atomique), jamais par lecture puis écriture séparée.
4. Respecter `src/lib/config.ts` : `DEPOSIT_FEE_RATE`, `MIN_DEPOSIT`,
   `MIN_WITHDRAWAL`, `WITHDRAWAL_FEE_RATE`.
5. Aucune clé privée dans le client : `KKIAPAY_PRIVATE_KEY`, `KKIAPAY_SECRET_KEY`,
   `BEEM_API_KEY`, `BEEM_SECRET_KEY`, `PAWAPAY_API_TOKEN` restent côté serveur.
6. Réponses d'erreur via le pattern maison `{ success: false, message }` + code HTTP approprié, jamais de stack trace (voir `src/app/api/wallet/deposit/route.ts`).
