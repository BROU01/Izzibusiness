'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Aviator — néobrutalisme gaming.
 *
 * Structure ergonomique iGaming (thumb-zone : multiplicateur en haut,
 * action en bas, cibles ≥ 48px) habillée avec les tokens du design system
 * (papier, encre, ombres dures, acid/grass/flame). Aucun néon, aucun
 * dégradé, aucun arrondi — DESIGN.md s'applique aux jeux comme au reste.
 *
 * Feedbacks :
 * - haptique : vibrate(10) au tap, [50,50,50] au crash, [30,100,30,100,50] au gros gain
 * - crash : screen shake 150ms (désactivé en reduced-motion)
 * - bouton d'action qui morphing selon l'état (machine à états)
 */

interface AviatorProps {
  balance: number;
  onBet?: (amount: number, game: string) => Promise<boolean>;
  onWin?: (amount: number, game: string, multiplier?: number) => Promise<boolean>;
}

const QUICK_BETS = [50, 100, 250, 500, 1000];

/** Haptique : silencieux si l'API n'existe pas (desktop, iOS Safari). */
function buzz(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignoré : l'haptique est un bonus, jamais une exigence.
    }
  }
}

/** Screen shake : rien en reduced-motion. */
function shake(reducedMotion: boolean): void {
  if (reducedMotion) return;
  document.body.animate(
    [
      { transform: 'translate(0,0)' },
      { transform: 'translate(3px,-3px)' },
      { transform: 'translate(-3px,3px)' },
      { transform: 'translate(0,0)' },
    ],
    { duration: 150, iterations: 1 },
  );
}

export default function Aviator({ balance, onBet, onWin }: AviatorProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [history, setHistory] = useState<{ multiplier: number; result: 'crash' | 'fly' }[]>([]);
  const [betHistory, setBetHistory] = useState<{ bet: number; multiplier: number; win: number }[]>(
    [],
  );
  const [timeLeft, setTimeLeft] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const multiplierRef = useRef(1.0);

  // prefers-reduced-motion : écouté à chaud (microtask, pas de setState sync).
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

  const generateCrashPoint = useCallback(() => {
    const r = Math.random();
    if (r < 0.33) return 1.0 + Math.random() * 0.5;
    if (r < 0.66) return 1.5 + Math.random() * 1.5;
    if (r < 0.9) return 3.0 + Math.random() * 4.0;
    return 7.0 + Math.random() * 18.0;
  }, []);

  const startCountdownRef = useRef<() => void>(() => {});

  const startCountdown = useCallback(() => {
    setGameState('waiting');
    setMultiplier(1.0);
    // Nouvelle manche : la mise est consommée (gagnée, perdue ou encaissée).
    setHasBet(false);
    setHasCashedOut(false);
    setCashOutMultiplier(0);
    multiplierRef.current = 1.0;

    let count = 5;
    setTimeLeft(count);

    const timer = setInterval(() => {
      count--;
      setTimeLeft(count);
      if (count <= 0) {
        clearInterval(timer);
        const crash = generateCrashPoint();
        setCrashPoint(crash);
        setGameState('flying');

        const multInterval = setInterval(() => {
          multiplierRef.current += 0.01 + multiplierRef.current * 0.005;
          setMultiplier(multiplierRef.current);

          if (multiplierRef.current >= crash) {
            clearInterval(multInterval);
            setGameState('crashed');
            setHistory((prev) => [{ multiplier: crash, result: 'crash' }, ...prev.slice(0, 9)]);
            buzz([50, 50, 50]);
            shake(reducedMotion);

            if (hasBet && !hasCashedOut) {
              setBetHistory((prev) => [
                { bet: betAmount, multiplier: crash, win: 0 },
                ...prev.slice(0, 9),
              ]);
            }

            setTimeout(() => startCountdownRef.current(), 3000);
          }
        }, 50);

        intervalRef.current = multInterval;
      }
    }, 1000);

    intervalRef.current = timer;
  }, [generateCrashPoint, hasBet, hasCashedOut, betAmount, reducedMotion]);

  useEffect(() => {
    startCountdownRef.current = startCountdown;
    const kickoff = setTimeout(() => startCountdownRef.current(), 0);
    return () => {
      clearTimeout(kickoff);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeBet = useCallback(async () => {
    if (betAmount > balance || betAmount <= 0 || gameState !== 'waiting') return;
    if (hasBet || processing) return;
    buzz(10);
    setProcessing(true);

    if (onBet) {
      const success = await onBet(betAmount, 'Aviator');
      if (!success) {
        setProcessing(false);
        return;
      }
    }

    setHasBet(true);
    setProcessing(false);
  }, [betAmount, balance, gameState, hasBet, processing, onBet]);

  const cashOut = useCallback(async () => {
    if (!hasBet || hasCashedOut || gameState !== 'flying') return;
    buzz(10);
    setProcessing(true);
    const winAmount = Math.floor(betAmount * multiplier);

    if (onWin) {
      // Crédit côté serveur (source de vérité) ; useWallet applique les soldes.
      await onWin(winAmount, 'Aviator', multiplier);
    }
    if (winAmount >= betAmount * 10) {
      buzz([30, 100, 30, 100, 50]);
    }

    setHasCashedOut(true);
    setCashOutMultiplier(multiplier);
    setBetHistory((prev) => [{ bet: betAmount, multiplier, win: winAmount }, ...prev.slice(0, 9)]);
    setProcessing(false);
  }, [hasBet, hasCashedOut, gameState, betAmount, multiplier, onWin]);

  const quickBets = QUICK_BETS;

  // ── Machine à états du bouton d'action (thumb-zone, 58px) ──
  const canBet = gameState === 'waiting' && !hasBet && !processing && betAmount <= balance;
  const actionButton = (() => {
    if (gameState === 'waiting' && hasBet) {
      return (
        <button
          type="button"
          disabled
          className="btn w-full"
          style={{ minHeight: 58, background: 'var(--paper-2)', color: 'var(--ink)' }}
        >
          Mise engagée — décollage dans {timeLeft}s
        </button>
      );
    }
    if (gameState === 'flying' && hasBet && !hasCashedOut) {
      return (
        <button
          type="button"
          onClick={cashOut}
          disabled={processing}
          className="btn w-full"
          style={{
            minHeight: 58,
            background: 'var(--grass)',
            color: 'var(--paper)',
            boxShadow: '6px 6px 0 var(--ink)',
          }}
        >
          {processing
            ? '…'
            : `Encaisser ${Math.floor(betAmount * multiplier).toLocaleString('fr-FR')} FCFA`}
        </button>
      );
    }
    if (gameState === 'flying' && hasCashedOut) {
      return (
        <button
          type="button"
          disabled
          className="btn w-full"
          style={{ minHeight: 58, background: 'var(--paper-2)' }}
        >
          Encaissé à {cashOutMultiplier.toFixed(2)}x
        </button>
      );
    }
    // waiting / crashed sans mise → pari
    return (
      <button
        type="button"
        onClick={placeBet}
        disabled={!canBet}
        className="btn w-full"
        style={{ minHeight: 58 }}
      >
        {processing ? '…' : `Miser ${betAmount.toLocaleString('fr-FR')} FCFA`}
      </button>
    );
  })();

  return (
    <div className="mx-auto w-full max-w-[480px]">
      {/* ── Zone d'observation : solde + multiplicateur ── */}
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
        {gameState === 'flying' && (
          <div
            className="font-mono font-black"
            style={{
              fontSize: 40,
              color:
                multiplier >= 3 ? 'var(--grass)' : multiplier >= 2 ? 'var(--acid)' : 'var(--paper)',
            }}
          >
            {multiplier.toFixed(2)}x
          </div>
        )}
        {gameState === 'crashed' && (
          <div className="text-right">
            <div className="font-mono text-2xl font-black text-flame">CRASH</div>
            <div className="font-mono text-sm text-paper/70">{crashPoint.toFixed(2)}x</div>
          </div>
        )}
        {gameState === 'waiting' && (
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-paper/60">
              Décollage
            </div>
            <div className="font-mono text-3xl font-black text-acid">{timeLeft}s</div>
          </div>
        )}
      </div>

      {/* ── Courbe : fond encre, trait acid/grass en pointillés ── */}
      <div
        className="relative mt-3 flex min-h-[180px] items-center justify-center overflow-hidden border-3 border-ink p-4"
        style={{ background: 'var(--ink)' }}
      >
        {gameState === 'flying' && (
          <>
            <svg
              width="100%"
              height="120"
              viewBox="0 0 400 120"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={`M 10 110 Q 200 ${110 - multiplier * 3} 390 ${Math.max(8, 110 - multiplier * 4)}`}
                fill="none"
                stroke={multiplier >= 3 ? 'var(--grass)' : 'var(--acid)'}
                strokeWidth="3"
                strokeDasharray="6,4"
              />
            </svg>
            <span className="absolute bottom-2 right-3 font-mono text-3xl font-black text-paper">
              {multiplier.toFixed(2)}x
            </span>
          </>
        )}
        {gameState === 'crashed' && (
          <div className="text-center">
            <div className="font-mono text-5xl font-black text-flame">✕</div>
            <div className="mt-2 font-mono text-xs uppercase tracking-widest text-paper/60">
              Crashé à {crashPoint.toFixed(2)}x
            </div>
          </div>
        )}
        {gameState === 'waiting' && (
          <div className="text-center">
            <div className="font-mono text-sm uppercase tracking-widest text-paper/60">
              Prochain vol
            </div>
            <div className="font-mono text-6xl font-black text-acid">{timeLeft}</div>
            {/* Barre de warm-up : valeur portée par le chiffre ci-dessus */}
            <div className="mx-auto mt-3 h-2 w-40 border-2 border-paper/40" aria-hidden="true">
              <div className="h-full bg-acid" style={{ width: `${((5 - timeLeft) / 5) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Historique des crashs : jetons carrés mono ── */}
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Historique des multiplicateurs">
        {history.map((h, i) => (
          <span
            key={i}
            className="border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold"
            style={{
              background: h.multiplier >= 2 ? 'var(--grass)' : 'var(--flame)',
              color: h.multiplier >= 2 ? 'var(--paper)' : 'var(--paper)',
            }}
          >
            {h.multiplier.toFixed(2)}x
          </span>
        ))}
        {history.length === 0 && (
          <span className="font-mono text-xs text-ink-60">Aucun vol terminé</span>
        )}
      </div>

      {/* ── Mise : jetons rapides + saisie (thumb-zone) ── */}
      {gameState !== 'flying' && (
        <>
          <div className="mt-4 flex gap-2">
            {quickBets.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setBetAmount(amount);
                  buzz(10);
                }}
                disabled={gameState !== 'waiting'}
                className="flex-1 border-2 border-ink py-2 font-mono text-sm font-bold transition-transform active:translate(2px,2px)"
                style={{
                  background: betAmount === amount ? 'var(--acid)' : 'var(--paper)',
                  boxShadow: betAmount === amount ? '3px 3px 0 var(--ink)' : 'none',
                }}
              >
                {amount}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-60">
            Mise perso
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min={10}
              max={balance}
              disabled={gameState !== 'waiting'}
              className="input flex-1"
            />
          </label>
        </>
      )}

      {/* ── Zone d'action : bouton 58px pleine largeur ── */}
      <div className="mt-4">{actionButton}</div>

      {/* ── Résultat de la manche ── */}
      {gameState === 'crashed' && hasBet && !hasCashedOut && (
        <div
          className="mt-3 border-3 border-flame bg-flame/10 p-3 text-center font-mono text-sm font-bold text-flame"
          role="status"
        >
          Perdu : −{betAmount.toLocaleString('fr-FR')} FCFA
        </div>
      )}
      {gameState === 'crashed' && hasCashedOut && (
        <div
          className="mt-3 border-3 border-grass p-3 text-center font-mono text-sm font-bold text-grass"
          role="status"
        >
          Encaissé à {cashOutMultiplier.toFixed(2)}x = +
          {Math.floor(betAmount * cashOutMultiplier).toLocaleString('fr-FR')} FCFA
        </div>
      )}

      {/* ── Vos paris ── */}
      {betHistory.length > 0 && (
        <div className="card-flat mt-4 p-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest">
            Vos derniers paris
          </h4>
          <div className="mt-2 grid gap-1">
            {betHistory.slice(0, 5).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-ink/15 py-1.5 font-mono text-[13px] last:border-0"
              >
                <span>{h.bet.toLocaleString('fr-FR')} F</span>
                <span className={h.win > 0 ? 'font-bold text-grass' : 'font-bold text-flame'}>
                  {h.win > 0
                    ? `+${h.win.toLocaleString('fr-FR')}`
                    : `−${h.bet.toLocaleString('fr-FR')}`}
                </span>
                <span className="text-ink-60">{h.multiplier.toFixed(2)}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
