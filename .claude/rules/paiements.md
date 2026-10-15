---
description: Règles obligatoires pour tout flux de paiement, dépôt ou retrait
globs:
  - 'src/app/api/**/route.ts'
  - 'src/lib/paydunya.ts'
  - 'src/lib/payments/**'
  - 'src/lib/games/**'
alwaysApply: false
---

# Paiements

## Provider : PayDunya

| Usage                           | Fichiers                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Client API (factures, débours.) | `src/lib/paydunya.ts`                                                          |
| Dépôt / adhésion (facture)      | `src/lib/payments/checkout.ts`, `src/app/api/wallet/deposit`, `api/membership` |
| IPN (notification de paiement)  | `src/app/api/payment/paydunya/ipn/route.ts`, `src/lib/payments/sync.ts`        |
| Retraits (déboursement)         | `src/lib/payments/withdrawals.ts`, `src/app/api/admin/withdrawals/[id]`        |
| Mise en place                   | `docs/paydunya.md`                                                             |

## Règles

1. Ne jamais créditer sur la seule foi d'une notification : vérifier le `hash` IPN
   (SHA-512 de la MasterKey, comparaison en temps constant) PUIS relire la facture
   chez PayDunya (`confirmInvoice`) et comparer le montant.
2. Idempotence : `transactions.reference_id` est unique ; chaque crédit porte une
   référence (`pd:<token>`, `win:<round>`, `wd-refund:<id>`…).
3. Tout mouvement de solde passe par une fonction SQL atomique appelée depuis le
   serveur (`db/migrations/001_schema.sql`), jamais par lecture puis écriture.
4. Respecter `src/lib/config.ts` : `MIN_DEPOSIT`, `MAX_DEPOSIT`, `MIN_WITHDRAWAL`,
   `WITHDRAWAL_FEE_RATE`, `ADHESION_FEE`, `MIN_BET`, `MAX_BET`, `GAME_RTP`.
5. Aucune clé dans le client : `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`,
   `PAYDUNYA_TOKEN`, `DATABASE_URL`, `BETTER_AUTH_SECRET` restent côté serveur.
6. Réponses d'erreur `{ error: { code, message } }` (`src/lib/api-response.ts`),
   jamais de stack trace.
7. Jeux : le résultat est toujours tiré côté serveur ; le client n'envoie jamais un
   montant de gain.
