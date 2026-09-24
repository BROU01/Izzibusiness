# Izzibusiness — Design System « Néobrutalisme × Paper-Newsletter »

## Direction

**Une revue imprimée qui ne s'excuse pas.** Fond papier chaud, encre noire épaisse,
bordures nettes, typo display expressive. Pas de dégradé, pas d'angle arrondi,
pas d'ombre floue. La hiérarchie se lit à 3 mètres.

Le néobrutalisme porte la structure (bordures, ombres décalées, contrastes bruts).
Le paper-newsletter porte la matière (papier crème, grille millimétrée, annotations
mono, colonnes éditoriales).

---

## 1. Couleurs

| Token       | Hex                 | Usage                                         |
| ----------- | ------------------- | --------------------------------------------- |
| `--paper`   | `#F5F1E6`           | fond global (papier)                          |
| `--paper-2` | `#EDE7D6`           | fond alterné / zone tamisée                   |
| `--ink`     | `#14120D`           | texte, bordures, ombres                       |
| `--ink-60`  | `rgba(20,18,13,.6)` | texte secondaire                              |
| `--ink-40`  | `rgba(20,18,13,.4)` | texte tertiaire / placeholders                |
| `--acid`    | `#FFE500`           | accent 1 — highlights, badges, CTA secondaire |
| `--flame`   | `#FF4D1C`           | accent 2 — urgences, prix, alertes            |
| `--grass`   | `#00A86B`           | accent 3 — succès, gains, validation          |
| `--sky`     | `#2B59FF`           | accent 4 — liens, infos                       |

**Règles**

- `--ink` sur `--paper` = contraste > 15:1 ✅
- `--acid` uniquement **derrière** `--ink` (jamais du texte jaune sur papier).
- Pas de dégradé. Jamais. (taste-skill, frontend-design)
- Chaque section utilise **un seul** accent dominant.

---

## 2. Typographie

| Rôle               | Police                                    | Fallback                | Source       |
| ------------------ | ----------------------------------------- | ----------------------- | ------------ |
| Display / titres   | **Fraunces** (variable, opsz + wght)      | Georgia, serif          | Google Fonts |
| Body / UI          | **Fraunces** soft (opsz 14, wght 400-500) | Georgia, serif          | Google Fonts |
| Mono / annotations | **IBM Plex Mono**                         | ui-monospace, monospace | Google Fonts |

**Échelle (fluid, clamp)**

```
--fs-display: clamp(2.75rem, 1.2rem + 7vw, 6.5rem);   /* h1 hero */
--fs-h2:      clamp(1.85rem, 1.1rem + 3vw, 3.25rem);
--fs-h3:      clamp(1.25rem, 1rem + 1.1vw, 1.75rem);
--fs-body:    clamp(1rem, .95rem + .2vw, 1.1rem);
--fs-mono:    .72rem;   /* uppercase, tracking .14em */
```

**Règles**

- Inter **interdite** (taste-skill).
- H1 display : `font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 1;`
- Titres : `letter-spacing: -0.02em`, `line-height: 1.02` en display.
- Mono : toujours `text-transform: uppercase; letter-spacing: .14em` — c'est la
  voix « newsletter » du site (rubriques, numéros de section, labels).

---

## 3. Géométrie

```
--radius: 0;                 /* aucun arrondi sur les surfaces */
--border-w: 2px;             /* bordure standard */
--border-w-thick: 3px;       /* séparateurs de section, hero */
--shadow-hard: 6px 6px 0 var(--ink);
--shadow-hard-sm: 4px 4px 0 var(--ink);
--shadow-hard-lg: 10px 10px 0 var(--ink);
--shadow-none: none;
```

**Interactions**

- Bouton pressé : `transform: translate(4px,4px)` + `box-shadow: 2px 2px 0`.
- Card hover (si cliquable) : `translate(-3px,-3px)` + ombre `9px 9px`.
- Durée : `150ms cubic-bezier(.2,.8,.2,1)`.
- `prefers-reduced-motion: reduce` → animations désactivées.

---

## 4. Texture papier

- Fond global : `background-color: var(--paper)`.
- Grille millimétrée subtile en `background-image` (2 overlays `linear-gradient`,
  `rgba(20,18,13,.05)`, pas à `24px`) — **une seule**, pas de dégradé décoratif.
- Aucun `backdrop-filter`, aucun `blur` (frontend-design design checklist).

---

## 5. Composants

### Bouton

```
padding: .85rem 1.5rem;
border: 2px solid var(--ink);
box-shadow: 6px 6px 0 var(--ink);
background: var(--acid) | var(--ink) | transparent;
font: mono uppercase tracking .1em;  OU  display wght 600;
transition: 150ms;
```

Variants : `.btn` (acid), `.btn-ink` (fond encre, texte papier),
`.btn-ghost` (transparent), `.btn-flame`.

### Card

```
border: 2px solid var(--ink);
background: var(--paper);
box-shadow: 6px 6px 0 var(--ink);
padding: clamp(1.25rem, 3vw, 2rem);
```

### Input

```
border: 2px solid var(--ink);
background: #FFFDF7;          /* blanc cassé, pas #fff */
padding: .85rem 1rem;
:focus → outline: 3px solid var(--sky); outline-offset: 2px;
```

### Badge / Tag

```
border: 2px solid var(--ink);
background: var(--acid) | var(--paper);
font: mono uppercase .7rem tracking .12em;
padding: .25rem .6rem;
```

### Section header (motif newsletter)

```
[ 01 ]  ———— RUBRIQUE MONO ————
Titre display géant
```

---

## 6. Check-list de revue (avant de dire « terminé »)

- [ ] Aucun `rounded-*` > 0 sur une surface
- [ ] Aucun `gradient` (hors grille de fond)
- [ ] Aucun `shadow-*` flou Tailwind (`shadow-sm/md/lg` remplacés)
- [ ] Inter absente de `layout.tsx`
- [ ] Chaque page a 1 CTA principal visible sans scroll sur desktop
- [ ] Contraste texte/corps ≥ 7:1 vérifié sur `--ink`/`--paper`
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Mobile 375px : pas d'overflow horizontal
