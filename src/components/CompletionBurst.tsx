'use client';

import { useEffect, useState } from 'react';

/**
 * Salve de confettis à la complétion d'un jour du programme.
 *
 * CSS pur (aucune dépendance) : 24 morceaux animés en translate/rotate,
 * couleurs du design system (acid, flame, grass, sky), montage automatique
 * après ~1,8 s. Respecte prefers-reduced-motion : si l'utilisateur a demandé
 * moins d'animations, rien ne s'affiche (le feedback texte reste suffisant).
 *
 * Props :
 * - trigger : valeur qui change pour déclencher une salve (ex. compteur ou
 *   booléen de complétion). Passer null/false ne déclenche rien.
 * - active  : condition d'affichage (ex. jour vient d'être complété).
 */

const COLORS = ['#ffe500', '#ff4d1c', '#00a86b', '#2b59ff'];
const PIECES = 24;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

function buildPieces(seed: number): Piece[] {
  // PRNG déterministe par salve : évite le layout shift entre salves.
  let state = seed * 9973 + 7;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  return Array.from({ length: PIECES }, () => ({
    left: next() * 100,
    delay: next() * 0.4,
    duration: 1.1 + next() * 0.7,
    color: COLORS[Math.floor(next() * COLORS.length)],
    rotation: Math.floor(next() * 360),
    size: 6 + Math.floor(next() * 6),
  }));
}

export default function CompletionBurst({
  trigger,
  active,
}: {
  trigger: number | string;
  active: boolean;
}) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // prefers-reduced-motion : écouté dynamiquement (peut changer à chaud).
  // Lecture asynchrone (microtask) : évite le setState synchrone dans l'effet.
  useEffect(() => {
    let cancelled = false;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    Promise.resolve().then(() => {
      if (!cancelled) setReduceMotion(mq.matches);
    });
    const onUpdate = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onUpdate);
    return () => {
      cancelled = true;
      mq.removeEventListener('change', onUpdate);
    };
  }, []);

  // Génère/détruit la salve. buildPieces est appelé dans un setTimeout pour
  // respecter la règle « pas de setState synchrone dans un effet ».
  useEffect(() => {
    if (!active || reduceMotion) {
      const clear = window.setTimeout(() => setPieces(null), 0);
      return () => window.clearTimeout(clear);
    }
    const timer = window.setTimeout(() => {
      setPieces(buildPieces(Number(trigger) || 1));
    }, 0);
    const end = window.setTimeout(() => setPieces(null), 1900);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(end);
    };
  }, [trigger, active, reduceMotion]);

  if (!pieces) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <style>{`
        @keyframes burst-fall {
          0% { transform: translate3d(0, -6vh, 0) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate3d(var(--drift, 0px), 92vh, 0) rotate(var(--spin, 360deg)); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            border: '1px solid #14120d',
            // Pas de borderRadius : néobrutalisme, tout est anguleux.
            ['--drift' as string]: `${(p.left - 50) * 1.6}px`,
            ['--spin' as string]: `${p.rotation + 540}deg`,
            animation: `burst-fall ${p.duration}s cubic-bezier(0.2, 0.8, 0.3, 1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
