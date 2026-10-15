'use client';

import { useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react';

/**
 * Animations de la page d'accueil (Motion, voir .claude/skills/motion-dev-animations).
 * Règles : chaque mouvement guide la lecture ou confirme une action ; seules
 * transform et opacity bougent ; ombres dures de DESIGN.md ; « réduire les
 * animations » du système est respecté (MotionConfig reducedMotion="user"
 * coupe les déplacements, useReducedMotion coupe le reste).
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = '#14120d';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Racine : applique la préférence « réduire les animations » à toute la page. */
export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/** Conteneur du hero : ses enfants HeroItem apparaissent l'un après l'autre. */
export function HeroStagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/**
 * Surlignage acide qui se remplit de gauche à droite sur l'expression clé.
 * Le linear-gradient d'une seule couleur sert d'aplat redimensionnable
 * (background-size), pas de dégradé visible : conforme à DESIGN.md.
 */
export function Highlight({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="box-decoration-clone px-1"
      style={{
        backgroundImage: 'linear-gradient(var(--acid), var(--acid))',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 0',
      }}
      initial={{ backgroundSize: reduce ? '100% 100%' : '0% 100%' }}
      animate={{ backgroundSize: '100% 100%' }}
      transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
    >
      {children}
    </motion.span>
  );
}

/** Carte « Avant de t'engager » : se pose, puis son ombre dure apparaît (effet tampon). */
export function StampCard({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <motion.aside
      aria-label={label}
      className={className}
      initial={{ opacity: 0, y: 16, boxShadow: `0px 0px 0px ${INK}` }}
      animate={{ opacity: 1, y: 0, boxShadow: `6px 6px 0px ${INK}` }}
      transition={{
        opacity: { duration: 0.5, delay: 0.45 },
        y: { duration: 0.5, delay: 0.45, ease: EASE },
        boxShadow: { duration: 0.25, delay: 0.9 },
      }}
    >
      {children}
    </motion.aside>
  );
}

// ---------------------------------------------------------------------------
// Apparition au défilement
// ---------------------------------------------------------------------------

/** Bloc qui apparaît une fois visible (titres de section, appel final). */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export interface ServiceCard {
  title: string;
  desc: string;
  note: string;
  href: string;
  cta: string;
}

const MotionLink = motion.create(Link);

/**
 * Grille de services : apparition échelonnée, carte entièrement cliquable
 * qui se soulève au survol (translate -3px + ombre 9px, DESIGN.md).
 */
export function ServicesGrid({ items }: { items: ServiceCard[] }) {
  return (
    <motion.ul
      className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {items.map((s) => (
        <motion.li key={s.title} variants={fadeUp} className="flex">
          <MotionLink
            href={s.href}
            className="card flex w-full flex-col"
            style={{ boxShadow: `6px 6px 0px ${INK}` }}
            whileHover={{ x: -3, y: -3, boxShadow: `9px 9px 0px ${INK}` }}
            whileTap={{ x: 4, y: 4, boxShadow: `2px 2px 0px ${INK}` }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-2xl">{s.title}</h3>
            <p className="mt-2 flex-1 text-ink-70">{s.desc}</p>
            <p className="mt-4 border-t-2 border-ink/15 pt-3 font-mono text-xs font-bold uppercase tracking-wide">
              {s.note}
            </p>
            <span className="mt-4 font-bold underline underline-offset-4">{s.cta}</span>
          </MotionLink>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ---------------------------------------------------------------------------
// Comment ça marche
// ---------------------------------------------------------------------------

const STEP_DELAY = 0.3;

/**
 * Les étapes apparaissent dans l'ordre pendant qu'une barre acide se trace
 * au-dessus : le mouvement montre la séquence 1 → 4.
 */
export function StepsTimeline({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <motion.div
      className="mt-10"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div
        aria-hidden="true"
        className="mb-6 hidden h-[3px] origin-left bg-acid lg:block"
        variants={{
          hidden: { scaleX: 0 },
          show: {
            scaleX: 1,
            transition: { duration: STEP_DELAY * steps.length, ease: 'linear' },
          },
        }}
      />
      <motion.ol
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={{ hidden: {}, show: { transition: { staggerChildren: STEP_DELAY } } }}
      >
        {steps.map((step, i) => (
          <motion.li key={step.title} variants={fadeUp} className="border-3 border-paper p-6">
            <span className="font-mono text-3xl font-bold text-acid">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3 text-2xl">{step.title}</h3>
            <p className="mt-2 text-paper/80">{step.desc}</p>
          </motion.li>
        ))}
      </motion.ol>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b-3 border-ink">
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left text-xl font-bold"
        >
          {q}
          <motion.span
            aria-hidden="true"
            className="font-mono text-2xl"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            +
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-button`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <p className="pb-5 text-ink-70">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Questions fréquentes : boutons accessibles, réponse qui se déplie. */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <motion.div
      className="border-t-3 border-ink"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {items.map((item) => (
        <motion.div key={item.q} variants={fadeUp}>
          <FaqItem q={item.q} a={item.a} />
        </motion.div>
      ))}
    </motion.div>
  );
}
