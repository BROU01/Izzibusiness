# Izzibusiness — Formations, missions, jeux et wallet Mobile Money

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-black?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwind-css)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00e599?style=flat-square&logo=postgresql)

Application Next.js 16 (App Router) pour l'Afrique de l'Ouest (FCFA) : formations,
missions rémunérées, jeux à mises réelles tirés côté serveur, parrainage, wallet
Mobile Money (PayDunya) et panneau d'administration complet.

> Pour un agent IA travaillant sur ce dépôt, commence par [`CLAUDE.md`](./CLAUDE.md).

## Fonctionnalités

- **Accès** : l'accueil est public ; formations, missions, jeux, marché et parrainage
  demandent un compte (garde serveur `src/proxy.ts`).
- **Comptes** : inscription pseudo / e-mail / pays / téléphone / parrain / mot de passe,
  connexion par pseudo ou e-mail, mot de passe oublié par e-mail (Better Auth, sans OTP).
- **Wallet** : dépôts et adhésion par PayDunya (facture + IPN vérifiée), retraits vers le
  numéro du compte, validés puis payés par l'admin (déboursement PayDunya).
- **Jeux** : Aviator, Spin & Win, Apple Fortunes. Résultat tiré par le serveur, graine
  révélée après la partie, retour joueur réglé dans `src/lib/config.ts`.
- **Missions** : créées par l'admin, preuve envoyée par le membre, récompense créditée à
  la validation.
- **Admin** (`/admin`) : vue d'ensemble, comptes, paiements, retraits, jeux, missions,
  formations, messages, annonces, paramètres.
- **Marché multi-vendeurs** : en préparation.

## Stack

| Domaine            | Outil                                  |
| ------------------ | -------------------------------------- |
| Framework          | Next.js 16 (App Router), React 19      |
| Langage            | TypeScript (strict), zod               |
| Styles             | Tailwind CSS 4                         |
| Base de données    | Neon (PostgreSQL serverless), `pg`     |
| Authentification   | Better Auth (sessions en cookie)       |
| Paiements          | PayDunya (encaissement + déboursement) |
| E-mails            | Resend                                 |
| Lint / Format      | ESLint 9, Prettier                     |
| Gestion de paquets | **npm**                                |

Guides : base de données Neon [`docs/neon.md`](./docs/neon.md), paiements PayDunya
[`docs/paydunya.md`](./docs/paydunya.md).

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (jamais committées)
npm run db:migrate           # crée les tables dans la base Neon
npm run dev                  # http://localhost:3000
```

Les variables d'environnement sont listées dans [`.env.example`](./.env.example)
(noms uniquement).

## Scripts

| Script                              | Rôle                           | Origine    |
| ----------------------------------- | ------------------------------ | ---------- |
| `npm run dev`                       | serveur de développement       | existant   |
| `npm run build`                     | build de production            | existant   |
| `npm run start`                     | serveur de production          | existant   |
| `npm run lint`                      | ESLint                         | existant   |
| `npm run format`                    | formate le code (Prettier)     | **ajouté** |
| `npm run format:check`              | vérifie le format sans écrire  | **ajouté** |
| `npm run typecheck`                 | `tsc --noEmit`                 | **ajouté** |
| `npm run db:migrate`                | applique `db/migrations/*.sql` | **ajouté** |
| `npm run admin:promote -- <pseudo>` | donne le rôle admin            | **ajouté** |

Aucun script de test n'existe actuellement.

## Structure

```
src/app/           pages et routes API (App Router)
src/components/    composants React
src/hooks/         hooks React
src/lib/           logique métier (config, base de données, auth, PayDunya, jeux, paiements)
public/            assets statiques
db/migrations/     migrations SQL (Neon PostgreSQL)
scripts/           migrations, promotion admin, génération de visuels
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

## Design System

Le projet utilise un design system « Néobrutalisme × Paper-Newsletter » détaillé dans
[`DESIGN.md`](./DESIGN.md) :

- **Couleurs** : papier chaud (#F5F1E6), encre noire (#14120D), accents (acid, flame, grass, sky)
- **Typographie** : Fraunces (display/body), IBM Plex Mono (annotations)
- **Géométrie** : aucun arrondi, bordures nettes, ombres dures décalées
- **Texture** : fond papier avec grille millimétrée subtile

## Licence

MIT
