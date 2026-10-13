'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { formatFcfa } from '@/lib/config';

interface GameTx {
  id: string;
  type: 'game_bet' | 'game_win';
  amount: number;
  description: string | null;
  createdAt: string;
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; rows: GameTx[] };

/** Historique réel des mises et gains (table transactions). */
export default function GameHistoryPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [bets, wins] = await Promise.all(
          ['game_bet', 'game_win'].map((type) =>
            fetch(`/api/wallet/transactions?type=${type}&limit=50`).then((r) =>
              r.ok ? (r.json() as Promise<{ transactions: GameTx[] }>) : Promise.reject(),
            ),
          ),
        );
        if (cancelled) return;
        const rows = [...bets.transactions, ...wins.transactions].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        setState({ status: 'ready', rows });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Mon espace" title="Mes parties" description="Tes mises et tes gains." />

      {state.status === 'loading' && (
        <p role="status" className="font-mono text-sm uppercase tracking-wider">
          Chargement de l’historique…
        </p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="border-3 border-ink bg-[#ffe1d6] px-4 py-3 font-semibold">
          Impossible de charger l’historique. Recharge la page.
        </p>
      )}

      {state.status === 'ready' && state.rows.length === 0 && (
        <EmptyState
          title="Aucune partie jouée"
          description="Les jeux sont en maintenance pendant leur refonte. Ton historique apparaîtra ici dès ta première mise."
        />
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <div className="overflow-x-auto border-3 border-ink">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Détail</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((tx) => (
                <tr key={tx.id} className="border-t-2 border-ink">
                  <td className="px-4 py-3">
                    {new Date(tx.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {tx.description ?? (tx.type === 'game_win' ? 'Gain' : 'Mise')}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${tx.amount < 0 ? '' : 'text-[#00744a]'}`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {formatFcfa(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
