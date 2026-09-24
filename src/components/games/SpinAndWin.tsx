'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Spin & Win — néobrutalisme gaming.
 *
 * Roue encre/acid (segments carrés, aucune transparence décorative), aiguille
 * à gauche, décélération cubic-bezier à inertie, haptique par cran (le rythme
 * des clics suit la vitesse), cibles tactiles ≥ 44px. Probabilités honnêtes :
 * 6 segments gagnants sur 12, affichées telles quelles.
 */

interface SpinAndWinProps {
  balance: number;
  onBet?: (amount: number, game: string) => Promise<boolean>;
  onWin?: (amount: number, game: string, multiplier?: number) => Promise<boolean>;
}

const SEGMENTS = [
  { label: '—', multiplier: 0, bg: 'var(--paper-2)', fg: 'var(--ink)' },
  { label: '0.5x', multiplier: 0.5, bg: 'var(--paper)', fg: 'var(--ink)' },
  { label: '—', multiplier: 0, bg: 'var(--ink)', fg: 'var(--paper)' },
  { label: '1x', multiplier: 1, bg: 'var(--grass)', fg: 'var(--paper)' },
  { label: '—', multiplier: 0, bg: 'var(--paper-2)', fg: 'var(--ink)' },
  { label: '2x', multiplier: 2, bg: 'var(--acid)', fg: 'var(--ink)' },
  { label: '—', multiplier: 0, bg: 'var(--ink)', fg: 'var(--paper)' },
  { label: '5x', multiplier: 5, bg: 'var(--sky)', fg: 'var(--paper)' },
  { label: '—', multiplier: 0, bg: 'var(--paper-2)', fg: 'var(--ink)' },
  { label: '10x', multiplier: 10, bg: 'var(--flame)', fg: 'var(--paper)' },
  { label: '—', multiplier: 0, bg: 'var(--ink)', fg: 'var(--paper)' },
  { label: 'JACKPOT 25x', multiplier: 25, bg: 'var(--acid)', fg: 'var(--ink)' },
];

const SPIN_COST = 50;
const SPIN_DURATION_MS = 4000;
const TOTAL = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / TOTAL;

/** Haptique : silencieux si l'API n'existe pas. */
function buzz(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignoré.
    }
  }
}

export default function SpinAndWin({ balance, onBet, onWin }: SpinAndWinProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ segment: (typeof SEGMENTS)[0]; winAmount: number } | null>(
    null,
  );
  const [spinCount, setSpinCount] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rotationRef = useRef(0);
  const lastNotchRef = useRef(0);

  // prefers-reduced-motion : écouté à chaud.
  useEffect(() => {
    let cancelled = false;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    Promise.resolve().then(() => {
      if (!cancelled) setReducedMotion(mq.matches);
    });
    const onUpdate = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onUpdate);
    return () => {
      cancelled = true;
      mq.removeEventListener('change', onUpdate);
    };
  }, []);

  const spin = useCallback(async () => {
    if (spinning || balance < SPIN_COST || processing) return;
    buzz(10);
    setProcessing(true);

    if (onBet) {
      const success = await onBet(SPIN_COST, 'Spin & Win');
      if (!success) {
        setProcessing(false);
        return;
      }
    }

    setSpinning(true);
    setResult(null);
    lastNotchRef.current = 0;

    const winIndex = Math.floor(Math.random() * TOTAL);
    const segment = SEGMENTS[winIndex];

    // Géométrie : pointe à gauche (9h) = -90°. Cible avec jitter pour éviter
    // les frontières entre segments.
    const segmentCenter = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
    const targetBase = -90 - segmentCenter - jitter;
    const current = rotationRef.current;
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const totalRotation =
      current + fullRotations * 360 + ((((targetBase - current) % 360) + 360) % 360);

    rotationRef.current = totalRotation;
    setRotation(totalRotation);

    // Clics par cran : le rythme suit la décélération (approximation par
    // paliers — suffisant pour le feedback, sans boucle à 60fps).
    if (!reducedMotion) {
      const notches = fullRotations * TOTAL;
      const interval = SPIN_DURATION_MS / notches;
      for (let n = 1; n <= notches; n++) {
        const t = n * interval;
        // Espacement croissant : les derniers crans sont plus lents.
        const eased = t * (1 + (n / notches) * 1.2);
        setTimeout(
          () => {
            buzz(5);
            lastNotchRef.current = n;
          },
          Math.min(eased, SPIN_DURATION_MS - 50),
        );
      }
    }

    setTimeout(async () => {
      const winAmount = Math.floor(SPIN_COST * segment.multiplier);

      if (winAmount > 0 && onWin) {
        // Crédit serveur (source de vérité) ; useWallet applique les soldes.
        await onWin(winAmount, 'Spin & Win', segment.multiplier);
      }
      if (segment.multiplier >= 10) {
        buzz([30, 100, 30, 100, 50]);
      }

      setResult({ segment, winAmount });
      setSpinCount((prev) => prev + 1);
      setTotalWon((prev) => prev + winAmount);
      setSpinning(false);
      setProcessing(false);
    }, SPIN_DURATION_MS);
  }, [spinning, balance, processing, onBet, onWin, reducedMotion]);

  return (
    <div className="mx-auto w-full max-w-[480px]">
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Solde', value: `${balance.toLocaleString('fr-FR')} F` },
          { label: 'Tours', value: String(spinCount) },
          { label: 'Gagnés', value: `${totalWon.toLocaleString('fr-FR')} F` },
        ].map((s) => (
          <div
            key={s.label}
            className="border-3 border-ink px-2 py-2 text-center"
            style={{ background: 'var(--paper-2)' }}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-60">
              {s.label}
            </div>
            <div className="font-mono text-base font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Roue ── */}
      <div
        className="relative mx-auto mt-5"
        style={{ width: 'min(320px, 100%)', aspectRatio: '1' }}
      >
        {/* Aiguille (9h), carrée, encre */}
        <div
          aria-hidden="true"
          className="absolute z-10"
          style={{ left: '-6px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '22px solid var(--ink)',
            }}
          />
        </div>

        <div
          className="overflow-hidden border-3 border-ink"
          style={{
            width: '100%',
            height: '100%',
            boxShadow: '6px 6px 0 var(--ink)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.9, 0.3, 1)`
                : 'none',
            }}
          >
            {SEGMENTS.map((segment, i) => {
              const angle = i * SEGMENT_ANGLE;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '50%',
                    height: '50%',
                    left: '50%',
                    top: '50%',
                    transformOrigin: '0% 0%',
                    transform: `rotate(${angle}deg) skewY(${90 - SEGMENT_ANGLE}deg)`,
                    background: segment.bg,
                    borderBottom: '2px solid var(--ink)',
                    borderRight: '2px solid var(--ink)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="font-mono text-[11px] font-bold"
                    style={{
                      position: 'absolute',
                      left: '24%',
                      top: '42%',
                      transform: `skewY(-${90 - SEGMENT_ANGLE}deg) rotate(${SEGMENT_ANGLE / 2}deg)`,
                      color: segment.fg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {segment.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Moyeu */}
        <div
          aria-hidden="true"
          className="absolute flex items-center justify-center border-3 border-ink font-mono text-sm font-black"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 52,
            height: 52,
            background: 'var(--acid)',
            boxShadow: '3px 3px 0 var(--ink)',
            zIndex: 5,
          }}
        >
          GO
        </div>
      </div>

      {/* ── Action (thumb-zone) ── */}
      <div className="mt-5">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || balance < SPIN_COST || processing}
          className="btn w-full"
          style={{ minHeight: 58 }}
        >
          {processing ? '…' : spinning ? 'Ça tourne…' : `Tourner — ${SPIN_COST} FCFA`}
        </button>
        {balance < SPIN_COST && (
          <p className="mt-2 font-mono text-xs text-flame">
            Solde insuffisant.{' '}
            <a href="/dashboard/wallet" className="font-bold underline">
              Recharger mon wallet
            </a>
          </p>
        )}
      </div>

      {/* ── Résultat ── */}
      <div aria-live="polite">
        {result && (
          <div
            className={`mt-4 border-3 p-4 text-center ${result.winAmount > 0 ? 'border-grass' : 'border-flame'}`}
            style={{
              background: result.winAmount > 0 ? 'var(--grass)' : 'var(--flame)',
              color: 'var(--paper)',
            }}
          >
            {result.winAmount > 0 ? (
              <>
                <div className="font-mono text-2xl font-black">
                  +{result.winAmount.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-widest">
                  {result.segment.multiplier >= 25
                    ? 'JACKPOT !'
                    : `Multiplicateur ${result.segment.multiplier}x`}
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xl font-black">Segment vide</div>
                <div className="mt-1 font-mono text-xs uppercase tracking-widest">
                  Retente ta chance
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Grille des gains honnête ── */}
      <div className="card-flat mt-5 p-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-widest">
          Grille des gains — mise 50 F
        </h4>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: '0.5x', amount: '25 FCFA', bg: 'var(--paper)' },
            { label: '1x', amount: '50 FCFA', bg: 'var(--grass)' },
            { label: '2x', amount: '100 FCFA', bg: 'var(--acid)' },
            { label: '5x', amount: '250 FCFA', bg: 'var(--sky)' },
            { label: '10x', amount: '500 FCFA', bg: 'var(--flame)' },
            { label: '25x', amount: '1 250 FCFA', bg: 'var(--acid)' },
          ].map((prize) => (
            <div
              key={prize.label}
              className="border-2 border-ink p-2 text-center"
              style={{ background: prize.bg }}
            >
              <div className="font-mono text-sm font-bold">{prize.label}</div>
              <div className="font-mono text-[11px] text-ink-70">{prize.amount}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-ink-60">
          12 segments — 6 gagnants, 6 vides — chance de jackpot 1/12
        </p>
      </div>
    </div>
  );
}
