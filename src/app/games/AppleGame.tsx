'use client';

import { useState } from 'react';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { formatFcfa } from '@/lib/config';
import BetInput, { isBetValid } from './BetInput';
import type { ActiveRound, GameProps } from './types';

interface Round {
  id: string;
  bet: number;
  level: number;
  picks: number[];
  rotten: number[] | null;
  status: 'active' | 'won' | 'lost';
  payout: number;
}

function fromActive(active: ActiveRound | undefined): Round | null {
  if (!active) return null;
  return {
    id: active.id,
    bet: active.bet,
    level: Number(active.state.level ?? 0),
    picks: (active.state.picks as number[] | undefined) ?? [],
    rotten: null,
    status: 'active',
    payout: 0,
  };
}

/**
 * Tour de 8 étages, 4 cases par étage, une pomme pourrie par étage.
 * Positions tirées par le serveur à l'ouverture et révélées en fin de partie.
 */
export default function AppleGame({
  rules,
  balance,
  onBalance,
  onRoundEnd,
  active,
}: GameProps & { active?: ActiveRound }) {
  const [bet, setBet] = useState(rules.minBet * 2);
  const [round, setRound] = useState<Round | null>(() => fromActive(active));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levels = rules.appleLevels;
  const columns = rules.appleColumns;
  const multipliers = rules.appleMultipliers;
  const playing = round?.status === 'active';
  const currentMultiplier = round && round.level > 0 ? multipliers[round.level - 1] : 0;

  async function start() {
    setError(null);
    if (!isBetValid(bet, rules.minBet, rules.maxBet, balance)) {
      setError('Mise invalide ou solde insuffisant.');
      return;
    }
    setBusy(true);
    const res = await postJson<{ roundId: string; balance: number }>('/api/games/apple/start', {
      bet,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onBalance(res.data.balance);
    setRound({
      id: res.data.roundId,
      bet,
      level: 0,
      picks: [],
      rotten: null,
      status: 'active',
      payout: 0,
    });
  }

  async function pick(column: number) {
    if (!round || round.status !== 'active' || busy) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{
      outcome: 'safe' | 'lost' | 'won';
      level: number;
      rotten?: number[];
      payout?: number;
      balance?: number;
    }>('/api/games/apple/pick', { roundId: round.id, column });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    const picks = [...round.picks, column];
    if (res.data.outcome === 'safe') {
      setRound({ ...round, level: res.data.level, picks });
      return;
    }
    setRound({
      ...round,
      picks,
      level: res.data.level,
      rotten: res.data.rotten ?? null,
      status: res.data.outcome === 'won' ? 'won' : 'lost',
      payout: res.data.payout ?? 0,
    });
    if (typeof res.data.balance === 'number') onBalance(res.data.balance);
    onRoundEnd();
  }

  async function cashout() {
    if (!round || round.status !== 'active' || round.level < 1 || busy) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{ rotten: number[]; payout: number; balance: number }>(
      '/api/games/apple/cashout',
      { roundId: round.id },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setRound({ ...round, status: 'won', rotten: res.data.rotten, payout: res.data.payout });
    onBalance(res.data.balance);
    onRoundEnd();
  }

  function cellState(level: number, column: number) {
    if (!round) return 'idle';
    const picked = round.picks[level] === column;
    const rotten = round.rotten?.[level] === column;
    if (picked && rotten) return 'boom';
    if (picked) return 'safe';
    if (rotten) return 'rotten';
    if (round.status === 'active' && level === round.level) return 'open';
    return 'idle';
  }

  const CELL_STYLE: Record<string, string> = {
    idle: 'bg-paper-2 text-ink-70',
    open: 'bg-paper hover:bg-acid cursor-pointer',
    safe: 'bg-[#00744a] text-paper',
    boom: 'bg-flame text-paper',
    rotten: 'bg-paper text-[#b8320d]',
  };
  const CELL_LABEL: Record<string, string> = {
    idle: '',
    open: 'Choisir',
    safe: 'Bonne',
    boom: 'Pourrie',
    rotten: 'Pourrie',
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div className="flex flex-col-reverse gap-2" role="grid" aria-label="Étages de pommes">
        {Array.from({ length: levels }, (_, level) => (
          <div key={level} role="row" className="flex items-stretch gap-2">
            <span
              className={`flex w-16 shrink-0 items-center justify-center border-3 border-ink font-mono text-xs font-bold ${
                round && round.level > level ? 'bg-acid' : 'bg-paper'
              }`}
            >
              ×{multipliers[level].toLocaleString('fr-FR')}
            </span>
            {Array.from({ length: columns }, (_, column) => {
              const state = cellState(level, column);
              const clickable = state === 'open' && !busy;
              return (
                <button
                  key={column}
                  type="button"
                  role="gridcell"
                  disabled={!clickable}
                  onClick={() => pick(column)}
                  aria-label={`Étage ${level + 1}, case ${column + 1}${CELL_LABEL[state] ? ` : ${CELL_LABEL[state]}` : ''}`}
                  className={`h-11 flex-1 border-3 border-ink font-mono text-[11px] font-bold uppercase disabled:cursor-default ${CELL_STYLE[state]}`}
                >
                  {CELL_LABEL[state]}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-3xl">Apple Fortunes</h2>
          <p className="mt-2 text-ink-70">
            À chaque étage, choisis une case parmi {columns} : une seule pomme est pourrie. Chaque
            étage franchi augmente le multiplicateur ; encaisse quand tu veux.
          </p>
        </div>
        {error && <FormAlert tone="error">{error}</FormAlert>}

        {playing ? (
          <>
            <p className="font-mono text-sm">
              Mise {formatFcfa(round.bet)} · étage {round.level}/{levels}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={cashout}
              disabled={busy || round.level < 1}
            >
              {round.level < 1
                ? 'Choisis une case au premier étage'
                : `Encaisser ${formatFcfa(round.bet * currentMultiplier)}`}
            </button>
          </>
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
              {busy ? 'Ouverture…' : `Jouer ${formatFcfa(bet)}`}
            </button>
          </>
        )}

        <div aria-live="polite" className="min-h-[3.5rem]">
          {round?.status === 'won' && (
            <FormAlert tone="success">Encaissé : {formatFcfa(round.payout)}.</FormAlert>
          )}
          {round?.status === 'lost' && (
            <p className="border-3 border-ink px-4 py-3 font-semibold">
              Pomme pourrie à l’étage {round.level + 1} : mise perdue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
