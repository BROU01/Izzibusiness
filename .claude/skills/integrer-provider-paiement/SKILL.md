---
name: integrer-provider-paiement
description: Intégrer ou modifier un provider de paiement (Kkiapay, Beem, PawaPay) dans le projet — client, webhook, idempotence et règles métier. Utiliser pour tout nouveau flux de dépôt/retrait/paiement.
---

# Intégrer un provider de paiement

## Fichiers à connaître

| Rôle | Fichier |
|---|---|
| Client Kkiapay (signature, requêtes) | `src/lib/kkiapay.ts` |
| Constantes métier (ADHESION_FEE, MIN_WITHDRAWAL…) | `src/lib/config.ts` |
| Exemple de webhook (idempotence) | `src/app/api/payments/kkiapay/webhook/route.ts` |
| Exemple de dépôt | `src/app/api/wallet/deposit/route.ts` |
| Exemple de retrait | `src/app/api/wallet/withdraw/route.ts` |

## Checklist d'intégration

1. **Clés via `process.env` uniquement** — jamais dans le code, jamais `.env` copié.
   Voir `.env.example` pour la liste des variables attendues.
2. **Signature webhook vérifiée** : reproduire la vérification de
   `kkiapay/webhook/route.ts` (comparaison en temps constant, rejet en 400 en cas
   d'échec). Ne jamais faire confiance au body seul.
3. **Idempotence** : la clé de déduplication (`idempotency_key`/transaction id)
   doit empêcher le double crédit — cf. `ensureIdempotency`.
4. **Montants en FCFA via `formatFcfa()`** de `src/lib/config.ts`, jamais de
   calcul monétaire en dur dans une route.
5. **Transaction atomique** : création wallet_transaction + update wallet dans
   le même flux Supabase, avec rollback en cas d'échec.
6. **Retour utilisateur** : état de succès / échec / en attente visibles côté UI
   (page wallet, message d'erreur explicite).
7. **Sécurité** : ne jamais exposer `KKIAPAY_SECRET_KEY`, `BEEM_SECRET_KEY`,
   `PAWAPAY_API_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY` dans une réponse.

## Après modification

- `npm run lint` + `npm run typecheck` + `npm run build`.
- Tester le flux réel (dépôt minimal, retrait minimal) — un build vert ne prouve
  pas qu'un paiement passe.
