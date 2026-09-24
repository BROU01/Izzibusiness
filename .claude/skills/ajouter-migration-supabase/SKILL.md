---
name: ajouter-migration-supabase
description: Écrire une migration SQL Supabase dans supabase/migrations/ avec numérotation correcte, RLS activé et rollback annoncé. Utiliser pour tout changement de schéma ou de politique RLS.
---

# Ajouter une migration Supabase

## Règles de numérotation

- Fichier : `supabase/migrations/NNN_description_courte.sql`
- `NNN` = numéro du dernier fichier + 1, toujours 3 chiffres (ex : `006_...`).
- Dernière migration actuelle : `005_program_progress.sql`.
- Une migration = une intention. Ne jamais mélanger schéma et données de seed.

## Structure obligatoire

```sql
-- 006_description.sql
-- But : <une phrase>.
-- Rollback : <comment annuler>.

begin;

  create table if not exists public.<table> (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
  );

  -- RLS activé AVANT les policies, jamais après
  alter table public.<table> enable row level security;

  create policy "<table>_select_own" on public.<table>
    for select using (auth.uid() = user_id);

  create policy "<table>_insert_own" on public.<table>
    for insert with check (auth.uid() = user_id);

commit;
```

## Règles non-négociables

1. **RLS systématique** : toute nouvelle table a `enable row level security` + au moins une policy `auth.uid() = user_id`.
2. **Pas de `drop` sans `if not exists`/`if exists`** ; pas de `truncate` sur des tables de prod.
3. **Aucun secret, aucun `service_role` dans le SQL**.
4. **Dépendances** : référencer `auth.users(id)`, pas un id texte.
5. **`begin`/`commit`** pour rendre la migration atomique.
6. **Le commentaire de rollback est obligatoire** — même si le rollback est « recréer la table d'avant ».

## Après création

- Annoncer que `supabase db push` (ou equivalent) doit être exécuté manuellement : ce projet n'a pas de script npm de migration.
- Ne jamais exécuter une migration sur une base de production sans autorisation explicite (règle `AGENTS.md`).
