---
description: Conventions base de données (Neon PostgreSQL, Better Auth, migrations) du projet
globs:
  - 'db/**'
  - 'src/lib/db.ts'
  - 'src/lib/auth.ts'
  - 'src/lib/session.ts'
alwaysApply: false
---

# Base de données (Neon PostgreSQL)

## Accès

- `src/lib/db.ts` : pool `pg` unique (`query`, `queryOne`, `callFunction`, `withTransaction`).
  **Serveur uniquement** : jamais importé dans un composant `'use client'`.
- `src/lib/auth.ts` : Better Auth (tables `"user"`, `"session"`, `"account"`, `"verification"`).
- `src/lib/session.ts` : `getSessionUser()`, `getMemberProfile()`, `getCurrentProfile()`.
- Routes API : `requireUser()` / `requireProfile()` (`src/lib/api-response.ts`),
  `requireAdmin()` (`src/lib/admin-api.ts`).

## Pas de RLS : l'autorisation est dans le code

Le navigateur ne parle jamais à la base. Chaque requête qui lit ou écrit des données
d'un membre filtre **explicitement** par l'id de la session (`where user_id = $1`).
Une route admin passe d'abord par `requireAdmin()`.

## Migrations

- Fichiers `db/migrations/NNN_nom.sql`, appliqués dans l'ordre par `npm run db:migrate`
  (une seule fois chacun, table `schema_migrations`, une transaction par fichier :
  pas de `begin`/`commit` dans le fichier).
- Ne jamais modifier une migration déjà appliquée en production : en créer une nouvelle.
- Une migration = une intention ; rollback annoncé en tête de fichier.
- Ne jamais lancer une migration sur la base de production sans accord explicite.

## Règles

1. Requêtes paramétrées (`$1`, `$2`…) uniquement, jamais de concaténation de valeurs.
2. Tout mouvement d'argent passe par une fonction SQL atomique et idempotente
   (`transactions.reference_id` unique), jamais par lecture puis écriture.
3. `pg` renvoie `numeric` en texte et `timestamptz` en `Date` : convertir avant de répondre.
4. Pas de `any` : typer les lignes (`query<{ id: string }>(…)`).
