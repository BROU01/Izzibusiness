'use client';

import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { formatFcfa } from '@/lib/config';
import SpinGame from './SpinGame';
import AppleGame from './AppleGame';
import AviatorGame from './AviatorGame';
import type { GameId, GamesState } from './types';

const TABS: { id: GameId; label: string }[] = [
  { id: 'aviator', label: 'Aviator' },
  { id: 'spin', label: 'Spin & Win' },
  { id: 'apple', label: 'Apple Fortunes' },
];

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: GamesState };

function AcceptRules({ onAccepted, rtp }: { onAccepted: () => void; rtp: number }) {
  const adultId = useId();
  const rulesId = useId();
  const [adult, setAdult] = useState(false);
  const [rules, setRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const res = await postJson<{ accepted: boolean }>('/api/games/accept', { adult, rules });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onAccepted();
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl" noValidate>
      <h2 className="text-2xl">Avant de jouer</h2>
      <ul className="mt-3 list-[square] space-y-1 pl-5 text-ink-70">
        <li>Les mises sont débitées de ton wallet et les gains y sont crédités.</li>
        <li>Chaque résultat est tiré par le serveur ; aucun gain n’est garanti.</li>
        <li>
          Sur la durée, environ {Math.round(rtp * 100)} % des mises sont redistribuées aux joueurs.
        </li>
        <li>Ne mise jamais l’argent dont tu as besoin pour vivre.</li>
      </ul>
      {error && (
        <div className="mt-4">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}
      <div className="mt-5 flex items-start gap-3">
        <input
          id={adultId}
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[#14120d]"
          checked={adult}
          onChange={(e) => setAdult(e.target.checked)}
        />
        <label htmlFor={adultId}>J’ai 18 ans ou plus.</label>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <input
          id={rulesId}
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[#14120d]"
          checked={rules}
          onChange={(e) => setRules(e.target.checked)}
        />
        <label htmlFor={rulesId}>
          J’ai lu les règles ci-dessus et les{' '}
          <Link href="/terms" className="font-bold underline underline-offset-4">
            conditions d’utilisation
          </Link>
          .
        </label>
      </div>
      <button type="submit" className="btn btn-primary mt-6" disabled={busy}>
        {busy ? 'Enregistrement…' : 'Accéder aux jeux'}
      </button>
    </form>
  );
}

export default function GamesClient() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [tab, setTab] = useState<GameId>('aviator');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let stop = false;
    void (async () => {
      try {
        const res = await fetch('/api/games', { cache: 'no-store' });
        const payload = (await res.json()) as { data?: GamesState };
        if (stop) return;
        if (!res.ok || !payload.data) throw new Error('load');
        setLoad({ status: 'ready', data: payload.data });
      } catch {
        if (!stop) setLoad({ status: 'error' });
      }
    })();
    return () => {
      stop = true;
    };
  }, [version]);

  const setBalance = useCallback((balance: number) => {
    setLoad((prev) =>
      prev.status === 'ready' ? { status: 'ready', data: { ...prev.data, balance } } : prev,
    );
  }, []);

  if (load.status === 'loading') {
    return (
      <p role="status" className="font-mono text-sm uppercase tracking-wider">
        Chargement des jeux…
      </p>
    );
  }
  if (load.status === 'error') {
    return (
      <div className="max-w-xl">
        <FormAlert tone="error">Les jeux n’ont pas pu être chargés.</FormAlert>
        <button type="button" className="btn btn-primary mt-4" onClick={reload}>
          Réessayer
        </button>
      </div>
    );
  }

  const state = load.data;

  if (!state.isMember) {
    return (
      <div className="card max-w-2xl">
        <h2 className="text-2xl">Réservé aux adhérents</h2>
        <p className="mt-2 text-ink-70">
          Active ton adhésion depuis ton wallet pour jouer avec ton solde.
        </p>
        <Link href="/dashboard/wallet" className="btn btn-primary mt-5">
          Activer mon adhésion
        </Link>
      </div>
    );
  }

  if (!state.accepted) return <AcceptRules onAccepted={reload} rtp={state.rules.rtp} />;

  const common = {
    rules: state.rules,
    balance: state.balance,
    onBalance: setBalance,
    onRoundEnd: reload,
  };
  const activeFor = (game: GameId) => state.active.find((r) => r.game === game);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Choix du jeu" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`border-3 border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                tab === t.id ? 'bg-acid' : 'bg-paper hover:bg-paper-2'
              }`}
            >
              {t.label}
              {!state.enabled[t.id] && ' (fermé)'}
            </button>
          ))}
        </div>
        <p className="font-mono text-sm">
          Solde : <strong>{formatFcfa(state.balance)}</strong>{' '}
          <Link href="/dashboard/wallet" className="underline underline-offset-4">
            Déposer
          </Link>
        </p>
      </div>

      <section role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {!state.enabled[tab] ? (
          <div className="card">
            <h2 className="text-2xl">Jeu fermé temporairement</h2>
            <p className="mt-2 text-ink-70">
              L’administration a mis ce jeu en pause. Réessaie plus tard.
            </p>
          </div>
        ) : tab === 'spin' ? (
          <SpinGame key="spin" {...common} />
        ) : tab === 'apple' ? (
          <AppleGame
            key={`apple-${activeFor('apple')?.id ?? 'new'}`}
            {...common}
            active={activeFor('apple')}
          />
        ) : (
          <AviatorGame
            key={`aviator-${activeFor('aviator')?.id ?? 'new'}`}
            {...common}
            active={activeFor('aviator')}
          />
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl">Mes dernières parties</h2>
        {state.recent.length === 0 ? (
          <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
            Aucune partie terminée pour l’instant.
          </p>
        ) : (
          <div className="overflow-x-auto border-3 border-ink">
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
              <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Jeu</th>
                  <th className="px-4 py-3 text-right">Mise</th>
                  <th className="px-4 py-3 text-right">Multiplicateur</th>
                  <th className="px-4 py-3 text-right">Gain</th>
                </tr>
              </thead>
              <tbody>
                {state.recent.map((r) => (
                  <tr key={r.id} className="border-t-2 border-ink">
                    <td className="px-4 py-3">{TABS.find((t) => t.id === r.game)?.label}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(r.bet)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      ×{r.multiplier.toLocaleString('fr-FR')}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${r.payout > 0 ? 'text-[#00744a]' : ''}`}
                    >
                      {r.payout > 0 ? `+${formatFcfa(r.payout)}` : 'Perdu'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
