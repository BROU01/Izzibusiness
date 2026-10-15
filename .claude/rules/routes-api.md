---
description: Schéma canonique d'une route API du projet
globs:
  - 'src/app/api/**/route.ts'
alwaysApply: false
---

# Routes API

Modèle de référence : `src/app/api/wallet/deposit/route.ts`.

Une route suit ce schéma :

1. Méthodes HTTP nommées explicitement (`GET`, `POST`, `PUT`, `DELETE`) en export
   nommé — jamais `export default`.
2. Auth vérifiée en premier (`requireUser()` / `requireProfile()` / `requireAdmin()`), sauf route publique
   justifiée (webhooks : vérification de signature à la place).
3. Validation du body (zod ou vérification manuelle typée).
4. Traitement métier avec les librairies de `src/lib/`.
5. Réponse : `{ data }` en cas de succès, `{ error: { code, message } }` en échec,
   codes tirés de `src/lib/error-codes.ts`.
6. Statuts cohérents : 400 validation, 401 non authentifié, 403 interdit,
   404 absent, 409 conflit, 500 erreur serveur.
7. `console.error` uniquement côté serveur pour l'erreur inattendue ; ne jamais
   fuiter de stack trace ou de secret dans la réponse.
