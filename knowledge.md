# knowledge.md

> Historique et décisions de l'équipe. Ajouter une entrée datée à chaque décision
> technique significative ; ne pas supprimer l'historique.

## Comment utiliser ce fichier

- Une entrée = un titre `## [YYYY-MM-DD] sujet`, le contexte, la décision, les
  alternatives rejetées.
- Les faits stables (stack, commandes) vivent dans `CLAUDE.md` et `README.md`,
  pas ici.

---

## [2026-09-24] Mise en place des bonnes pratiques Claude Code

**Contexte.** Audit du projet : aucun formatter configuré, aucun typecheck dédié,
README obsolète, aucun test automatisé, `console.*` dispersées dans le code.

**Décision.**

- Prettier ajouté (devDependency) avec `.prettierrc` / `.prettierignore`.
- Scripts `format`, `format:check`, `typecheck` ajoutés au `package.json`.
- `CLAUDE.md` réécrit comme référence principale ; `.env.example` créé (noms seuls).
- Hook PostToolUse dans `.claude/settings.json` : formatage auto des fichiers TS/MD
  modifiés.
- 4 skills projet (`creer-route-api`, `ajouter-migration-supabase`,
  `creer-page-admin`, `integrer-provider-paiement`) et 4 règles
  (`paiements`, `supabase`, `ui-design`, `routes-api`).
- Workflow CI GitHub (`format:check`, `typecheck`, `lint`, `build`).

**Alternatives rejetées.**

- ESLint `--fix` en hook : plus lent et plus destructeur que Prettier sur ce dépôt.
- Vitest / Playwright : non installés ; ajout reporté tant que l'équipe ne les
  valide pas (aucun script de test n'existe actuellement).

## [stack] Décisions structurantes

- Next.js 16 App Router + React 19 + Neon PostgreSQL (`pg`) + Better Auth
  (octobre 2026, remplace Supabase dont l'offre gratuite était saturée) :
  le navigateur ne parle jamais à la base, chaque route API vérifie la
  session et filtre par l'id du membre (pas de RLS).
- npm (pas pnpm ni yarn) : verrous `package-lock.json`.
- Règles métier centralisées dans `src/lib/config.ts`, jamais en dur dans l'UI.
