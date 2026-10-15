---
name: ajouter-migration
description: Écrire une migration SQL dans db/migrations/ (Neon PostgreSQL) avec numérotation correcte et rollback annoncé. Utiliser pour tout changement de schéma ou de fonction SQL.
---

# Ajouter une migration

## Numérotation

- Fichier : `db/migrations/NNN_description_courte.sql` (3 chiffres, numéro du dernier + 1).
- Première migration : `001_schema.sql` (schéma complet).
- Une migration = une intention. Ne pas mélanger schéma et données de démonstration.

## Structure

```sql
-- 002_description.sql
-- But : <une phrase>.
-- Rollback : <comment annuler>.

create table <table> (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  created_at timestamptz not null default now()
);

create index <table>_user_idx on <table> (user_id, created_at desc);
```

## Règles non négociables

1. **Pas de `begin`/`commit`** : `npm run db:migrate` exécute chaque fichier dans une transaction.
2. **Identifiants de compte en `text`** référençant `"user"("id")` (format Better Auth).
3. **Pas de RLS** (la base n'est jamais exposée au navigateur) : l'autorisation est faite
   dans les routes API, qui filtrent par `user_id`.
4. **Argent** : nouvelle fonction SQL atomique, idempotente via `reference_id`.
5. **Aucun secret dans le SQL.**
6. **Commentaire de rollback obligatoire.**

## Après création

- Tester en local (`DATABASE_URL` d'une base de test) : `npm run db:migrate`.
- Ne jamais appliquer sur la base de production sans autorisation explicite (`AGENTS.md`).
