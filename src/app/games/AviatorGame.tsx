'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { formatFcfa } from '@/lib/config';
import BetInput, { isBetValid } from './BetInput';
import type { ActiveRound, GameProps } from './types';

type Phase =
  | { kind: 'idle' }
  | { kind: 'flying'; roundId: string; bet: number; startedAtMs: number }
  | { kind: 'won'; bet: number; multiplier: number; payout: number; crash: number }
  | { kind: 'lost'; bet: number; crash: number };

const POLL_MS = 1000;

function floor2(value: number) {
  return Math.floor(value * 100) / 100;
}

/**
 * Le multiplicateur monte en e^(k·t). Le point de crash est tiré par le
 * serveur à l'ouverture et reste secret ; l'encaissement est calculé par le
 * serveur au moment où il reçoit la demande.
 */
export default function AviatorGame({
  rules,
  balance,
  onBalance,
  onRoundEnd,
  active,
}: GameProps & { active?: ActiveRound }) {
  const k = rules.aviatorGrowthRate;
  const [bet, setBet] = useState(rules.minBet * 2);
  const [phase, setPhase] = useState<Phase>(() =>
    active
      ? {
          kind: 'flying',
          roundId: active.id,
          bet: active.bet,
          startedAtMs: Date.parse(active.startedAt),
        }
      : { kind: 'idle' },
  );
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settledRef = useRef(false);

  const elapsed = phase.kind === 'flying' ? Math.max(0, now - phase.startedAtMs) : 0;
  const multiplier =
    phase.kind === 'flying'
      ? Math.min(floor2(Math.exp((k * elapsed) / 1000)), rules.aviatorMaxMultiplier)
      : phase.kind === 'won'
        ? phase.multiplier
        : phase.kind === 'lost'
          ? phase.crash
          : 1;

  const finish = useCallback(
    (next: Phase) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setPhase(next);
      onRoundEnd();
    },
    [onRoundEnd],
  );

  // Animation locale du multiplicateur.
  useEffect(() => {
    if (phase.kind !== 'flying') return;
    let frame = 0;
    const loop = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase.kind]);

  // Le serveur dit quand l'avion s'arrête.
  useEffect(() => {
    if (phase.kind !== 'flying') return;
    const { roundId, bet: roundBet } = phase;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/games/aviator/status?roundId=${roundId}`, {
          cache: 'no-store',
        });
        const payload = (await res.json()) as {
          data?: { status: string; crash?: number | null };
        };
        if (payload.data && payload.data.status === 'lost') {
          finish({ kind: 'lost', bet: roundBet, crash: Number(payload.data.crash ?? 1) });
        }
      } catch {
        // Réseau instable : prochaine tentative au tick suivant.
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [phase, finish]);

  async function start() {
    setError(null);
    if (!isBetValid(bet, rules.minBet, rules.maxBet, balance)) {
      setError('Mise invalide ou solde insuffisant.');
      return;
    }
    setBusy(true);
    const res = await postJson<{ roundId: string; balance: number }>('/api/games/aviator/start', {
      bet,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    settledRef.current = false;
    onBalance(res.data.balance);
    setNow(Date.now());
    setPhase({ kind: 'flying', roundId: res.data.roundId, bet, startedAtMs: Date.now() });
  }

  async function cashout() {
    if (phase.kind !== 'flying' || busy) return;
    setBusy(true);
    const res = await postJson<{
      outcome: 'won' | 'lost';
      multiplier?: number;
      crash: number;
      payout?: number;
      balance?: number;
    }>('/api/games/aviator/cashout', { roundId: phase.roundId });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    if (res.data.outcome === 'won') {
      if (typeof res.data.balance === 'number') onBalance(res.data.balance);
      finish({
        kind: 'won',
        bet: phase.bet,
        multiplier: res.data.multiplier ?? 0,
        payout: res.data.payout ?? 0,
        crash: res.data.crash,
      });
    } else {
      finish({ kind: 'lost', bet: phase.bet, crash: res.data.crash });
    }
  }

  // Courbe : x = temps, y = multiplicateur.
  const seconds = elapsed / 1000;
  const maxX = Math.max(10, seconds * 1.1);
  const maxY = Math.max(2, multiplier * 1.15);
  const points: string[] = [];
  if (phase.kind === 'flying') {
    for (let i = 0; i <= 40; i++) {
      const t = (seconds * i) / 40;
      const m = Math.exp(k * t);
      points.push(`${(t / maxX) * 300},${160 - ((m - 1) / (maxY - 1)) * 150}`);
    }
  }

  // Couleurs lisibles sur fond encre (contraste > 4,5:1).
  const tone =
    phase.kind === 'lost' ? 'text-flame' : phase.kind === 'won' ? 'text-grass' : 'text-paper';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="border-3 border-ink bg-ink p-4 text-paper shadow-hard">
        <p className={`text-center font-display text-6xl font-black ${tone}`} aria-live="off">
          ×{multiplier.toFixed(2).replace('.', ',')}
        </p>
        <svg viewBox="0 0 300 160" className="mt-4 w-full" role="img" aria-label="Courbe du vol">
          <line x1="0" y1="160" x2="300" y2="160" stroke="#f5f1e6" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="160" stroke="#f5f1e6" strokeWidth="2" />
          {points.length > 1 && (
            <polyline points={points.join(' ')} fill="none" stroke="#ffe500" strokeWidth="3" />
          )}
        </svg>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-3xl">Aviator</h2>
          <p className="mt-2 text-ink-70">
            Le multiplicateur monte jusqu’à un point d’arrêt tiré au hasard (jusqu’à ×
            {rules.aviatorMaxMultiplier}). Encaisse avant l’arrêt pour gagner mise × multiplicateur.
          </p>
        </div>
        {error && <FormAlert tone="error">{error}</FormAlert>}

        {phase.kind === 'flying' ? (
          <button type="button" className="btn btn-primary" onClick={cashout} disabled={busy}>
            {busy ? 'Encaissement…' : `Encaisser ${formatFcfa(phase.bet * multiplier)}`}
          </button>
        ) : (
          <>
            <BetInput
              value={bet}
              onChange={setBet}
              min={rules.minBet}
              max={rules.maxBet}
              balance={balance}
              disabled={busy}
            />
            <button type="button" className="btn btn-primary" onClick={start} disabled={busy}>
              {busy ? 'Décollage…' : `Décoller avec ${formatFcfa(bet)}`}
            </button>
          </>
        )}

        <div aria-live="polite" className="min-h-[3.5rem]">
          {phase.kind === 'won' && (
            <FormAlert tone="success">
              Encaissé à ×{phase.multiplier.toLocaleString('fr-FR')} : {formatFcfa(phase.payout)}.
              L’avion s’est arrêté à ×{phase.crash.toLocaleString('fr-FR')}.
            </FormAlert>
          )}
          {phase.kind === 'lost' && (
            <p className="border-3 border-ink px-4 py-3 font-semibold">
              Arrêt à ×{phase.crash.toLocaleString('fr-FR')} : mise perdue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
