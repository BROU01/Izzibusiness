---
name: integrer-provider-paiement
description: Intégrer ou modifier un flux de paiement PayDunya (dépôt, adhésion, retrait/déboursement, IPN) — client, idempotence, fonctions SQL atomiques et règles métier. Utiliser pour tout nouveau flux d'argent.
---

# Intégrer ou modifier un flux de paiement

## Fichiers à connaître

| Rôle                                    | Fichier                                           |
| --------------------------------------- | ------------------------------------------------- |
| Client PayDunya (facture, débours.)     | `src/lib/paydunya.ts`                             |
| Création de facture + ligne `payments`  | `src/lib/payments/checkout.ts`                    |
| Synchronisation (IPN et page de retour) | `src/lib/payments/sync.ts`                        |
| Retraits admin                          | `src/lib/payments/withdrawals.ts`                 |
| Fonctions SQL d'argent                  | `db/migrations/001_schema.sql` |
| Constantes métier                       | `src/lib/config.ts`                               |
| Guide de configuration                  | `docs/paydunya.md`                                |

## Checklist

1. Clés via `process.env` uniquement (voir `.env.example`).
2. IPN : hash vérifié en temps constant, puis statut relu chez PayDunya.
3. Idempotence : référence unique dans `transactions.reference_id`.
4. Mouvement de solde = une fonction SQL atomique (`credit_wallet`, `debit_wallet`,
   `complete_payment`, `request_withdrawal`, `refund_withdrawal`…), exécutable par le
   seul `service_role`.
5. Montants via `src/lib/config.ts` et `formatFcfa()`.
6. États visibles côté UI : en attente, confirmé, annulé, échoué.

## Après modification

- `npm run format` → `typecheck` → `lint` → `build`.
- Rejouer les scénarios SQL (crédit rejoué, double retrait, solde insuffisant).
- Tester en sandbox PayDunya, puis un petit paiement réel avant ouverture.
