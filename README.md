# Izzibusiness — plateforme fitness (Next.js)

Application Next.js 16 (App Router) : programmes sportifs, suivi de progression,
portefeuille avec dépôts/retraits mobile money (Kkiapay, Beem, PawaPay),
back-office admin.

> Pour un agent IA travaillant sur ce dépôt, commence par [`CLAUDE.md`](./CLAUDE.md).

## Stack

| Domaine            | Outil                             |
| ------------------ | --------------------------------- |
| Framework          | Next.js 16 (App Router), React 19 |
| Langage            | TypeScript (strict)               |
| Styles             | Tailwind CSS 4                    |
| Base de données    | Supabase (PostgreSQL + RLS)       |
| Paiements          | Kkiapay, Beem, PawaPay            |
| Email / SMS        | Resend, Twilio                    |
| Lint / Format      | ESLint 9, Prettier                |
| Gestion de paquets | **npm**                           |

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (jamais committées)
npm run dev                  # http://localhost:3000
```

Les variables d'environnement sont listées dans [`.env.example`](./.env.example)
(noms uniquement).

## Scripts

| Script                 | Rôle                          | Origine    |
| ---------------------- | ----------------------------- | ---------- |
| `npm run dev`          | serveur de développement      | existant   |
| `npm run build`        | build de production           | existant   |
| `npm run start`        | serveur de production         | existant   |
| `npm run lint`         | ESLint                        | existant   |
| `npm run format`       | formate le code (Prettier)    | **ajouté** |
| `npm run format:check` | vérifie le format sans écrire | **ajouté** |
| `npm run typecheck`    | `tsc --noEmit`                | **ajouté** |

Aucun script de test n'existe actuellement.

## Structure

```
src/app/           pages et routes API (App Router)
src/components/    composants React
src/hooks/         hooks React
src/lib/           logique métier (config, clients Supabase, providers paiement)
public/            assets statiques
supabase/migrations/  migrations SQL (RLS activée)
scripts/           scripts utilitaires (génération de visuels)
docs/              definition-of-done, design-system
.claude/           settings (hooks), règles et skills du projet
.github/           workflow CI, template de PR
```

## CI

Le workflow `.github/workflows/ci.yml` exécute à chaque push et pull request :
`npm ci`, `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Contribution

1. Lire `CLAUDE.md` et les règles dans `.claude/rules/`.
2. Formatter avant de committer : `npm run format`.
3. Vérifier : `npm run format:check && npm run typecheck && npm run lint && npm run build`.
4. Une modification = une intention ; ne pas réécrire un composant existant sans
   vérifier les abstractions en place.
