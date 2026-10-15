'use client';

import { useState } from 'react';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { formatFcfa } from '@/lib/config';
import BetInput, { isBetValid } from './BetInput';
import type { GameProps } from './types';

const SPIN_MS = 3200;

function point(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(rad), y: 100 - radius * Math.cos(rad) };
}

function segmentFill(multiplier: number) {
  if (multiplier >= 5) return '#ff4d1c';
  if (multiplier >= 2) return '#ffe500';
  if (multiplier > 0) return '#f5f1e6';
  return '#eae4d3';
}

function label(multiplier: number) {
  return multiplier === 0 ? '0' : `×${multiplier.toLocaleString('fr-FR')}`;
}

/**
 * Roue de 20 cases équiprobables. Le résultat vient du serveur ; la roue
 * ne fait que l'animer jusqu'à la case tirée.
 */
export default function SpinGame({ rules, balance, onBalance, onRoundEnd }: GameProps) {
  const segments = rules.spinSegments;
  const step = 360 / segments.length;
  const [bet, setBet] = useState(rules.minBet * 2);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ multiplier: number; payout: number } | null>(null);

  async function spin() {
    if (spinning) return;
    setError(null);
    setResult(null);
    if (!isBetValid(bet, rules.minBet, rules.maxBet, balance)) {
      setError('Mise invalide ou solde insuffisant.');
      return;
    }
    setSpinning(true);
    const response = await postJson<{
      segment: number;
      multiplier: number;
      payout: number;
      balance: number;
    }>('/api/games/spin', { bet });

    if (!response.ok) {
      setError(response.error.message);
      setSpinning(false);
      return;
    }

    const { segment, multiplier, payout } = response.data;
    // La case tirée doit s'arrêter sous le repère (en haut).
    const target = (360 - (segment * step + step / 2)) % 360;
    setRotation((current) => {
      const base = current - (current % 360);
      return base + 5 * 360 + target;
    });
    // Le solde affiché passe d'abord par la mise débitée.
    onBalance(balance - bet);
    window.setTimeout(() => {
      setSpinning(false);
      setResult({ multiplier, payout });
      onBalance(response.data.balance);
      onRoundEnd();
    }, SPIN_MS);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="relative mx-auto w-full max-w-[26rem]">
        <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label="Roue Spin & Win">
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '100px 100px',
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(.17,.67,.21,1)` : 'none',
            }}
          >
            {segments.map((m, i) => {
              const a = point(i * step, 96);
              const b = point((i + 1) * step, 96);
              const center = i * step + step / 2;
              const text = point(center, 74);
              return (
                <g key={i}>
                  <path
                    d={`M100 100 L${a.x} ${a.y} A96 96 0 0 1 ${b.x} ${b.y} Z`}
                    fill={segmentFill(m)}
                    stroke="#14120d"
                    strokeWidth="1.5"
                  />
                  <text
                    x={text.x}
                    y={text.y}
                    fill={m >= 5 ? '#f5f1e6' : '#14120d'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${center} ${text.x} ${text.y})`}
                  >
                    {label(m)}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="96" fill="none" stroke="#14120d" strokeWidth="3" />
          </g>
          <circle cx="100" cy="100" r="14" fill="#14120d" />
          <path d="M92 0 L108 0 L100 16 Z" fill="#14120d" />
        </svg>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-3xl">Spin &amp; Win</h2>
          <p className="mt-2 text-ink-70">
            20 cases de même probabilité. Ton gain = mise × multiplicateur de la case. Retour joueur
            moyen : {Math.round(rules.rtp * 100)} %.
          </p>
        </div>
        {error && <FormAlert tone="error">{error}</FormAlert>}
        <BetInput
          value={bet}
          onChange={setBet}
          min={rules.minBet}
          max={rules.maxBet}
          balance={balance}
          disabled={spinning}
        />
        <button type="button" className="btn btn-primary" onClick={spin} disabled={spinning}>
          {spinning ? 'La roue tourne…' : `Tourner la roue pour ${formatFcfa(bet)}`}
        </button>
        <div aria-live="polite" className="min-h-[3.5rem]">
          {result &&
            (result.payout > 0 ? (
              <FormAlert tone="success">
                {label(result.multiplier)} : tu gagnes {formatFcfa(result.payout)}.
              </FormAlert>
            ) : (
              <p className="border-3 border-ink px-4 py-3 font-semibold">
                Case ×0 : mise perdue. Retente quand tu veux.
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
