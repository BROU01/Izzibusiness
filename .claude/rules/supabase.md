---
description: Conventions Supabase (client, RLS, migrations) du projet
globs:
  - 'supabase/**'
  - 'src/lib/supabase*.ts'
alwaysApply: false
---

# Supabase

## Clients

- `src/lib/supabase.ts` : client applicatif (anonyme, RLS respectée).
- `src/lib/admin.ts` : client **service role** — réservé aux routes API serveur.
  Jamais importé dans un composant client.

## Migrations

- Numérotation séquentielle dans `supabase/migrations/NNN_nom.sql`.
- Ne jamais modifier une migration déjà appliquée : créer une nouvelle.
- Toujours activer RLS sur une nouvelle table et définir les politiques.
- Une migration = une intention ; annoncer le rollback dans la PR.

## Règles

1. Pas d'écriture directe en base depuis un composant client.
2. Les données utilisateur passent par une route API (`src/app/api/**`).
3. Types de retour : utiliser les types générés, éviter `any`.
