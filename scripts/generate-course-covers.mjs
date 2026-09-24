/**
 * Générateur de couvertures SVG pour les fiches formation.
 *
 * Produit une couverture par formation, dans le langage néobrutalisme ×
 * paper-newsletter de DESIGN.md : fond papier, grille millimétrée, initiale
 * display en Fraunces, bandeau d'accent, annotation mono. Reproductible :
 * relancer `node scripts/generate-course-covers.mjs` après tout ajout de
 * formation (rendu déterministe).
 *
 * Sortie : public/images/courses/<slug>.svg + default.svg
 *
 * Usage : node scripts/generate-course-covers.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'courses');

// ---------------------------------------------------------------------------
// Source de vérité : la liste des formations. Pour l'instant copiée depuis
// src/app/formations/page.tsx (données mock) — à remplacer par une extraction
// partagée si le catalogue devient dynamique.
// ---------------------------------------------------------------------------

const COURSES = [
  { slug: 'montage-video', title: 'Montage vidéo Pro', accent: '#ff4d1c' },
  { slug: 'va', title: 'Assistant Virtuel', accent: '#2b59ff' },
  { slug: 'smm', title: 'Social Media Manager', accent: '#00a86b' },
  { slug: 'growth', title: 'Growth Hacking', accent: '#ffe500' },
  { slug: 'ia', title: 'Intelligence Artificielle', accent: '#ff4d1c' },
  { slug: 'cyber', title: 'Cybersécurité', accent: '#2b59ff' },
  { slug: 'design', title: 'Design Graphique', accent: '#00a86b' },
  { slug: 'branding', title: 'Branding & Identité Visuelle', accent: '#ffe500' },
  { slug: 'ecom', title: 'E-commerce', accent: '#ff4d1c' },
  { slug: 'immo', title: 'Immobilier', accent: '#2b59ff' },
  { slug: 'bourse', title: 'Bourse & Trading', accent: '#00a86b' },
  { slug: 'crypto', title: 'Crypto-monnaies', accent: '#ffe500' },
  { slug: 'dropshipping', title: 'Dropshipping', accent: '#ff4d1c' },
  { slug: 'affiliation', title: "Marketing d'Affiliation", accent: '#2b59ff' },
  { slug: 'copy', title: 'Copywriting', accent: '#00a86b' },
  { slug: 'vj', title: 'VJing & Mix Audio-Visuel', accent: '#ffe500' },
  { slug: 'cyberia', title: 'CyberIA — Sécurité & IA', accent: '#ff4d1c' },
  { slug: 'clinquant', title: 'Clinquant — Tu deviens riche', accent: '#2b59ff' },
];

const DEFAULT_COVER = { slug: 'default', title: 'Formation', accent: '#ffe500' };

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------

const INK = '#14120d';
const PAPER = '#f5f1e6';
const PAPER_2 = '#eae4d3';
const W = 800;
const H = 450;

/** Grille millimétrée : 24px, trait 1px à 5% d'encre. */
function gridPattern(id) {
  return `
  <pattern id="grid-${id}" width="24" height="24" patternUnits="userSpaceOnUse">
    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="${INK}" stroke-opacity="0.05" stroke-width="1"/>
  </pattern>`;
}

/**
 * Deux lignes de titre avec césure manuelle (les titres courts tiennent en
 * 2 lignes max ; pas de wrap automatique en SVG).
 */
function titleLines(title) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 18 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCover({ slug, title, accent }) {
  const id = slug.replace(/[^a-z0-9]/g, '-');
  const lines = titleLines(title);
  const initial = (title.trim().charAt(0) || 'F').toUpperCase();

  // Titre : part du bas, chaque ligne monte de 64px.
  const titleStartY = H - 70 - (lines.length - 1) * 64;

  // Contraste : sur fond acid, texte encre ; sur papier, texte encre aussi.
  const titleColor = INK;

  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="56" y="${titleStartY + i * 64}" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="56" letter-spacing="-1" fill="${titleColor}">${escapeXml(line)}</text>`,
    )
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(title)}">
  <defs>${gridPattern(id)}</defs>

  <!-- Fond papier + grille millimétrée -->
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#grid-${id})"/>

  <!-- Grande initiale en filigrane, côté droit -->
  <text x="${W - 56}" y="${H - 56}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="280" letter-spacing="-8" fill="${INK}" fill-opacity="0.08">${initial}</text>

  <!-- Bordure épaisse néobrutalisme -->
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${INK}" stroke-width="3"/>

  <!-- Filet d'accent gauche (6px, comme CourseImage) -->
  <rect x="0" y="0" width="6" height="${H}" fill="${accent}"/>

  <!-- Bandeau haut : catégorie générique + annotation -->
  <rect x="6" y="0" width="${W - 6}" height="56" fill="${PAPER_2}"/>
  <line x1="6" y1="56" x2="${W}" y2="56" stroke="${INK}" stroke-width="2"/>
  <text x="40" y="36" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="15" font-weight="700" letter-spacing="3" fill="${INK}">FORMATION</text>
  <text x="${W - 40}" y="36" text-anchor="end" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="15" font-weight="500" letter-spacing="2" fill="${INK}" fill-opacity="0.6">IZZIBUSINESS ACADEMY</text>

  <!-- Titre -->
  ${titleSvg}

  <!-- Annotation bas gauche -->
  <text x="56" y="${H - 28}" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2" fill="${INK}" fill-opacity="0.6">MODULE DE FORMATION</text>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });

const all = [...COURSES, DEFAULT_COVER];
for (const course of all) {
  const svg = buildCover(course);
  const file = join(OUT_DIR, `${course.slug}.svg`);
  writeFileSync(file, svg, 'utf8');
  console.log(`✓ ${course.slug}.svg`);
}

console.log(`\n${all.length} couvertures générées dans public/images/courses/`);
