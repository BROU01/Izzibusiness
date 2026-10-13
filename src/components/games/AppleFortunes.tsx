'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * AppleFortunes — néobrutalisme gaming.
 *
 * Grille progressive 8 cases : flip 3D (rotateY, preserve-3d) à la
 * révélation, flash rouge pleine grille au crash puis révélation des cases
 * restantes en transparence (preuve d'équité — le joueur voit ce qu'il a
 * raté), encaissement en thumb-zone (58px). Aucun emoji décoratif : les
 * états sont typographiques (multiplicateur, ✕, ?).
 */

interface AppleFortunesProps {
  balance: number;
  onBet?: (amount: number, game: string) => Promise<boolean>;
  onWin?: (amount: number, game: string, multiplier?: number) => Promise<boolean>;
}

const MULTIPLIERS = [1.2, 1.5, 2.0, 3.0, 5.0, 10.0, 25.0, 50.0];
const TOTAL_ROUNDS = 8;
const CRASH_CHANCE = 0.15;

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

type CellState = 'hidden' | 'revealed' | 'crash';

/** Tirage du crash — module-level : la fonction est purement locale au jeu,
 * jamais appelée pendant le rendu (uniquement dans les handlers). */
function rollCrash(): boolean {
  return Math.random() < CRASH_CHANCE;
}

export default function AppleFortunes({ balance, onBet, onWin }: AppleFortunesProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'won'>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [cells, setCells] = useState<CellState[]>(() => new Array(TOTAL_ROUNDS).fill('hidden'));
  const [crashIndex, setCrashIndex] = useState<number>(-1);
  const [totalWin, setTotalWin] = useState(0);
  const [history, setHistory] = useState<
    { bet: number; multiplier: number; win: number; result: 'win' | 'crash' }[]
  >([]);
  const [processing, setProcessing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animatingRef = useRef(false);

  // prefers-reduced-motion : flip et flash désactivés si demandé.
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

  const startGame = async () => {
    if (betAmount > balance || betAmount <= 0 || processing) return;
    buzz(10);
    setProcessing(true);

    if (onBet) {
      const success = await onBet(betAmount, 'Apple Fortunes');
      if (!success) {
        setProcessing(false);
        return;
      }
    }

    setGameState('playing');
    setCurrentRound(0);
    setCurrentMultiplier(1.0);
    setCells(new Array(TOTAL_ROUNDS).fill('hidden'));
    setCrashIndex(-1);
    setTotalWin(0);
    animatingRef.current = false;
    setProcessing(false);
  };

  const revealCell = (index: number) => {
    if (animatingRef.current || processing) return;
    if (cells[index] !== 'hidden') return;
    if (gameState !== 'playing') return;
    buzz(10);
    animatingRef.current = true;

    const isCrash = rollCrash();

    setTimeout(async () => {
      if (isCrash) {
        // Flash rouge + révélation d'équité : toutes les cases restantes
        // s'affichent en transparence pour prouver que le crash était là.
        setCrashIndex(index);
        setCells((prev) =>
          prev.map((c, i) => (i === index ? 'crash' : c === 'hidden' ? 'revealed' : c)),
        );
        setGameState('crashed');
        setHistory((prev) => [
          { bet: betAmount, multiplier: currentMultiplier, win: 0, result: 'crash' },
          ...prev.slice(0, 9),
        ]);
        if (!reducedMotion) {
          document.body.animate(
            [{ filter: 'none' }, { filter: 'invert(0.08) saturate(2)' }, { filter: 'none' }],
            { duration: 180, iterations: 1 },
          );
        }
        buzz([50, 50, 50]);
        animatingRef.current = false;
        return;
      }

      const newRound = currentRound + 1;
      const newMultiplier = MULTIPLIERS[Math.min(newRound, MULTIPLIERS.length - 1)];
      setCells((prev) => prev.map((c, i) => (i === index ? 'revealed' : c)));
      setCurrentRound(newRound);
      setCurrentMultiplier(newMultiplier);

      if (newRound >= TOTAL_ROUNDS) {
        const winAmount = Math.floor(betAmount * newMultiplier);
        if (onWin) {
          // Crédit serveur (source de vérité).
          await onWin(winAmount, 'Apple Fortunes', newMultiplier);
        }
        if (newMultiplier >= 10) {
          buzz([30, 100, 30, 100, 50]);
        }
        setTotalWin(winAmount);
        setGameState('won');
        setHistory((prev) => [
          { bet: betAmount, multiplier: newMultiplier, win: winAmount, result: 'win' },
          ...prev.slice(0, 9),
        ]);
      }

      animatingRef.current = false;
    }, 450);
  };

  const cashOut = async () => {
    if (gameState !== 'playing' || currentRound === 0 || processing) return;
    buzz(10);
    setProcessing(true);
    const winAmount = Math.floor(betAmount * currentMultiplier);

    if (onWin) {
      // Crédit serveur (source de vérité).
      await onWin(winAmount, 'Apple Fortunes', currentMultiplier);
    }

    setTotalWin(winAmount);
    setGameState('won');
    setHistory((prev) => [
      { bet: betAmount, multiplier: currentMultiplier, win: winAmount, result: 'win' },
      ...prev.slice(0, 9),
    ]);
    setProcessing(false);
  };

  const cellContent = (index: number): { label: string; bg: string; fg: string } => {
    if (cells[index] === 'crash') return { label: '✕', bg: 'var(--flame)', fg: 'var(--paper)' };
    if (cells[index] === 'revealed') {
      // Cases révélées après un crash : transparence (équité).
      const dim = gameState === 'crashed' && index !== crashIndex;
      return {
        label: `${MULTIPLIERS[Math.min(currentRound, MULTIPLIERS.length - 1)]}x`,
        bg: dim ? 'var(--paper-2)' : 'var(--grass)',
        fg: dim ? 'var(--ink-60)' : 'var(--paper)',
      };
    }
    return { label: '?', bg: 'var(--paper)', fg: 'var(--ink-60)' };
  };

  const flipStyle = (index: number, bg: string, fg: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      background: bg,
      color: fg,
      border: '3px solid var(--ink)',
      boxShadow: cells[index] !== 'hidden' ? '3px 3px 0 var(--ink)' : 'none',
    };
    if (reducedMotion) return base;
    return {
      ...base,
      transformStyle: 'preserve-3d',
      transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1), background 0.2s',
      transform: cells[index] === 'hidden' ? 'rotateY(0deg)' : 'rotateY(180deg)',
    };
  };

  return (
    <div className="mx-auto w-full max-w-[480px]">
      {/* ── Zone d'observation : multiplicateur courant ── */}
      <div
        className="flex items-center justify-between border-3 border-ink px-4 py-3"
        style={{ background: 'var(--ink)', color: 'var(--paper)' }}
      >
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-paper/60">Solde</div>
          <div className="font-mono text-xl font-bold text-acid">
            {balance.toLocaleString('fr-FR')} F
          </div>
        </div>
        {gameState === 'playing' && (
          <div className="text-right">
            <div
              className="font-mono text-4xl font-black"
              style={{ color: currentMultiplier >= 3 ? 'var(--grass)' : 'var(--acid)' }}
            >
              {currentMultiplier.toFixed(1)}x
            </div>
            <div className="font-mono text-[11px] text-paper/60">
              Potentiel : {Math.floor(betAmount * currentMultiplier).toLocaleString('fr-FR')} F ·
              case {currentRound + 1}/{TOTAL_ROUNDS}
            </div>
          </div>
        )}
      </div>

      {/* ── Mise (idle uniquement) ── */}
      {gameState === 'idle' && (
        <div className="mt-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-60">Mise</p>
          <div className="mt-2 flex gap-2">
            {[50, 100, 250, 500, 1000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setBetAmount(amount)}
                className="flex-1 border-2 border-ink py-2 font-mono text-sm font-bold"
                style={{
                  background: betAmount === amount ? 'var(--acid)' : 'var(--paper)',
                  boxShadow: betAmount === amount ? '3px 3px 0 var(--ink)' : 'none',
                }}
              >
                {amount}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={10}
            max={balance}
            className="input mt-3"
            aria-label="Montant personnalisé de la mise"
          />
        </div>
      )}

      {/* ── Grille 8 cases (flip 3D) ── */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, index) => {
          const cell = cellContent(index);
          const clickable = gameState === 'playing' && cells[index] === 'hidden' && !processing;
          return (
            <button
              key={index}
              type="button"
              onClick={() => revealCell(index)}
              disabled={!clickable}
              aria-label={
                clickable
                  ? `Case ${index + 1}, révéler`
                  : `Case ${index + 1}, ${cells[index] === 'hidden' ? 'non révélée' : 'révélée'}`
              }
              style={{
                ...flipStyle(index, cell.bg, cell.fg),
                cursor: clickable ? 'pointer' : 'default',
                opacity: cells[index] === 'hidden' && !clickable ? 0.6 : 1,
              }}
            >
              {/* Contenu : retourné avec la case en flip 3D, fixe sinon */}
              <span style={reducedMotion ? undefined : { transform: 'rotateY(180deg)' }}>
                {cell.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Progression ── */}
      {gameState === 'playing' && (
        <div className="mt-4">
          <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-ink-60">
            <span>Progression</span>
            <span>
              {currentRound}/{TOTAL_ROUNDS}
            </span>
          </div>
          <div className="mt-1 h-2 border-2 border-ink" aria-hidden="true">
            <div
              className="h-full bg-grass"
              style={{ width: `${(currentRound / TOTAL_ROUNDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Résultats ── */}
      {gameState === 'crashed' && (
        <div
          className="mt-4 border-3 border-flame p-4 text-center"
          style={{ background: 'var(--flame)', color: 'var(--paper)' }}
          role="status"
        >
          <div className="font-mono text-xl font-black">CRASH à la case {crashIndex + 1}</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-widest">
            Perdu : −{betAmount.toLocaleString('fr-FR')} FCFA · cases restantes révélées en grisé
          </div>
        </div>
      )}
      {gameState === 'won' && (
        <div
          className="mt-4 border-3 border-grass p-4 text-center"
          style={{ background: 'var(--grass)', color: 'var(--paper)' }}
          role="status"
        >
          <div className="font-mono text-2xl font-black">
            +{totalWin.toLocaleString('fr-FR')} FCFA
          </div>
          <div className="mt-1 font-mono text-xs uppercase tracking-widest">
            Multiplicateur {currentMultiplier.toFixed(1)}x
          </div>
        </div>
      )}

      {/* ── Action (thumb-zone 58px) ── */}
      <div className="mt-4">
        {gameState === 'idle' && (
          <button
            type="button"
            onClick={startGame}
            disabled={betAmount > balance || betAmount <= 0 || processing}
            className="btn w-full"
            style={{ minHeight: 58 }}
          >
            {processing ? '…' : `Jouer — ${betAmount.toLocaleString('fr-FR')} FCFA`}
          </button>
        )}
        {gameState === 'playing' && currentRound > 0 && (
          <button
            type="button"
            onClick={cashOut}
            disabled={processing}
            className="btn w-full"
            style={{ minHeight: 58, background: 'var(--grass)', color: 'var(--paper)' }}
          >
            {processing
              ? '…'
              : `Récupérer ${Math.floor(betAmount * currentMultiplier).toLocaleString('fr-FR')} FCFA`}
          </button>
        )}
        {(gameState === 'crashed' || gameState === 'won') && (
          <button
            type="button"
            onClick={() => setGameState('idle')}
            className="btn w-full"
            style={{ minHeight: 58 }}
          >
            Rejouer
          </button>
        )}
      </div>

      {/* ── Historique ── */}
      {history.length > 0 && (
        <div className="card-flat mt-4 p-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest">
            Parties récentes
          </h4>
          <div className="mt-2 grid gap-1">
            {history.slice(0, 5).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-ink/15 py-1.5 font-mono text-[13px] last:border-0"
              >
                <span>{h.bet.toLocaleString('fr-FR')} F</span>
                <span
                  className={h.result === 'win' ? 'font-bold text-grass' : 'font-bold text-flame'}
                >
                  {h.result === 'win'
                    ? `+${h.win.toLocaleString('fr-FR')}`
                    : `−${h.bet.toLocaleString('fr-FR')}`}
                </span>
                <span className="text-ink-60">{h.multiplier.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
