/**
 * Visuel des fiches formation.
 *
 * Les couvertures (`/images/courses/*.svg`) sont générées par
 * `scripts/generate-course-covers.mjs` : typographie Fraunces, grille
 * millimétrée, filet d'accent — le langage néobrutalisme × paper-newsletter
 * de DESIGN.md. Pour régénérer après ajout d'une formation :
 *   node scripts/generate-course-covers.mjs
 *
 * Si une URL d'image est absente ou cassée, le composant retombe sur le
 * bloc initiale + « Visuel à venir » (même cadre). Quand une vraie photo
 * existera (image_url Supabase), elle s'affichera avec le même cadre.
 */

const PALETTE = ['var(--paper-2)', 'var(--acid)', 'var(--paper)'] as const;

/** Hash déterministe : la même formation garde toujours la même teinte. */
function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
}

interface CourseImageProps {
  /** Titre de la formation — fournit l'initiale et la teinte. */
  title: string;
  /** URL d'image optionnelle (quand un visuel réel existera). */
  image?: string | null;
  /** Accent de la fiche (var(--acid), var(--flame)…), pour la bordure. */
  accent?: string;
}

export default function CourseImage({ title, image, accent = 'var(--ink)' }: CourseImageProps) {
  const initial = title.trim().charAt(0).toUpperCase() || 'F';
  const background = tintFor(title);

  return (
    <div
      aria-hidden="true"
      className="relative flex items-center justify-center border-b-[3px]"
      style={{
        height: '140px',
        background,
        borderColor: 'var(--ink)',
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          className="select-none font-black leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '72px',
            color: 'var(--ink)',
          }}
        >
          {initial}
        </span>
      )}

      {/* Annotation mono « newsletter » en bas à droite — marque le placeholder
          comme volontaire, pas comme une image oubliée. */}
      {!image && (
        <span
          className="absolute bottom-2 right-3 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--ink-60)' }}
        >
          Visuel à venir
        </span>
      )}

      {/* Filet d'accent gauche, cohérent avec le bandeau de la fiche */}
      <span className="absolute left-0 top-0 h-full w-[6px]" style={{ background: accent }} />
    </div>
  );
}
