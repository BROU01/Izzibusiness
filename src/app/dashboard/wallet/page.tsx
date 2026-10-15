'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { FormAlert } from '@/components/auth/FormField';
import { useSession } from '@/hooks/useSession';
import { formatFcfa } from '@/lib/config';
import MembershipCard from './MembershipCard';
import DepositForm from './DepositForm';
import WithdrawForm from './WithdrawForm';

interface Tx {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  status: 'requested' | 'processing' | 'paid' | 'rejected' | 'failed';
  note: string | null;
  createdAt: string;
}

const WITHDRAWAL_LABELS: Record<Withdrawal['status'], string> = {
  requested: 'En attente de validation',
  processing: 'Envoi en cours',
  paid: 'Envoyé',
  rejected: 'Refusé, montant restitué',
  failed: 'Échec, montant restitué',
};

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

function WalletContent() {
  const session = useSession();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('paiement') === 'annule';

  const [balance, setBalance] = useState<Load<number>>({ status: 'loading' });
  const [isMember, setIsMember] = useState(false);
  const [txs, setTxs] = useState<Load<Tx[]>>({ status: 'loading' });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let stop = false;
    void (async () => {
      try {
        const [w, t, wd] = await Promise.all([
          fetch('/api/wallet', { cache: 'no-store' }),
          fetch('/api/wallet/transactions?limit=30', { cache: 'no-store' }),
          fetch('/api/wallet/withdraw', { cache: 'no-store' }),
        ]);
        if (stop) return;
        if (!w.ok || !t.ok) throw new Error('load');
        const wallet = (await w.json()) as { wallet: { balance: number }; isMember: boolean };
        const history = (await t.json()) as { transactions: Tx[] };
        const pending = wd.ok ? ((await wd.json()) as { withdrawals: Withdrawal[] }) : null;
        if (stop) return;
        setBalance({ status: 'ready', data: wallet.wallet.balance });
        setIsMember(wallet.isMember);
        setTxs({ status: 'ready', data: history.transactions });
        setWithdrawals(pending?.withdrawals ?? []);
      } catch {
        if (!stop) {
          setBalance({ status: 'error' });
          setTxs({ status: 'error' });
        }
      }
    })();
    return () => {
      stop = true;
    };
  }, [version]);

  const amount = balance.status === 'ready' ? balance.data : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title="Wallet"
        description="Dépôts et retraits Mobile Money, adhésion et historique."
      />

      {cancelled && (
        <div className="mb-6">
          <FormAlert tone="error">Paiement annulé : aucun montant n’a été débité.</FormAlert>
        </div>
      )}

      <div className="mb-8 border-3 border-ink bg-ink px-6 py-6 text-paper shadow-hard">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-paper/75">
          Solde disponible
        </p>
        <p className="mt-2 font-display text-4xl font-black" aria-live="polite">
          {balance.status === 'loading'
            ? 'Chargement…'
            : balance.status === 'error'
              ? 'Indisponible'
              : formatFcfa(balance.data)}
        </p>
        {balance.status === 'error' && (
          <button type="button" className="mt-3 underline" onClick={refresh}>
            Réessayer
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {balance.status === 'ready' && !isMember && (
          <div className="lg:col-span-2">
            <MembershipCard balance={amount} onPaid={refresh} />
          </div>
        )}
        <DepositForm />
        {isMember ? (
          <WithdrawForm
            balance={amount}
            country={session.user?.country ?? null}
            phone={session.user?.phone ?? null}
            onRequested={refresh}
          />
        ) : (
          <section className="card">
            <h2 className="text-2xl">Retirer</h2>
            <p className="mt-2 text-ink-70">Les retraits sont ouverts aux adhérents.</p>
          </section>
        )}
      </div>

      {withdrawals.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl">Mes retraits</h2>
          <ul className="border-3 border-ink">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink px-4 py-3 last:border-b-0"
              >
                <span>
                  {formatFcfa(w.amount)}{' '}
                  <span className="text-sm text-ink-70">
                    le {new Date(w.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </span>
                <span className={`badge ${w.status === 'paid' ? 'badge-grass' : ''}`}>
                  {WITHDRAWAL_LABELS[w.status]}
                </span>
                {w.note && <p className="w-full text-sm text-ink-70">Motif : {w.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl">Historique</h2>
        {txs.status === 'loading' && (
          <p role="status" className="font-mono text-sm uppercase tracking-wider">
            Chargement…
          </p>
        )}
        {txs.status === 'error' && <FormAlert tone="error">Historique indisponible.</FormAlert>}
        {txs.status === 'ready' && txs.data.length === 0 && (
          <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
            Aucune opération pour l’instant. Ton premier dépôt apparaîtra ici.
          </p>
        )}
        {txs.status === 'ready' && txs.data.length > 0 && (
          <div className="overflow-x-auto border-3 border-ink">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Opération</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {txs.data.map((tx) => (
                  <tr key={tx.id} className="border-t-2 border-ink">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">{tx.description ?? tx.type}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.amount > 0 ? 'text-[#00744a]' : ''}`}
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
      </section>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense>
      <WalletContent />
    </Suspense>
  );
}
