import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import { load, requireAdminPage } from './_lib/load';
import { formatFcfa } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface Stats {
  users: number;
  members: number;
  banned: number;
  balances: number;
  deposits: number;
  memberships: number;
  withdrawals_paid: number;
  withdrawals_pending: number;
  withdrawals_pending_amount: number;
  game_bets: number;
  game_payouts: number;
  game_rounds: number;
  missions_open: number;
  submissions_pending: number;
  messages_new: number;
  registrations_new: number;
}

const TX_LABELS: Record<string, string> = {
  deposit: 'Dépôt',
  withdraw: 'Retrait',
  withdraw_refund: 'Retrait restitué',
  game_bet: 'Mise',
  game_win: 'Gain jeu',
  mission_reward: 'Mission',
  referral_bonus: 'Parrainage',
  purchase: 'Achat',
  membership: 'Adhésion',
  adjustment: 'Ajustement',
};

/** Vue d'ensemble : chiffres des 30 derniers jours et files d'attente à traiter. */
export default async function AdminDashboard() {
  await requireAdminPage();
  const [statsRes, recent] = await Promise.all([
    load<{ stats: Stats }>('select admin_stats() as stats'),
    load<{
      id: string;
      user_id: string;
      type: string;
      amount: string;
      description: string | null;
      created_at: Date;
    }>(
      `select id, user_id, type, amount, description, created_at
         from transactions
        order by created_at desc
        limit 15`,
    ),
  ]);
  const stats = statsRes.data[0]?.stats ?? null;
  const n = (v: number | undefined) => Number(v ?? 0);
  const margin = n(stats?.game_bets) - n(stats?.game_payouts);

  const todo = [
    {
      label: 'Retraits à valider',
      value: `${n(stats?.withdrawals_pending)} (${formatFcfa(n(stats?.withdrawals_pending_amount))})`,
      href: '/admin/withdrawals',
      urgent: n(stats?.withdrawals_pending) > 0,
    },
    {
      label: 'Preuves de mission',
      value: String(n(stats?.submissions_pending)),
      href: '/admin/missions',
      urgent: n(stats?.submissions_pending) > 0,
    },
    {
      label: 'Messages non traités',
      value: String(n(stats?.messages_new)),
      href: '/admin/messages',
      urgent: n(stats?.messages_new) > 0,
    },
    {
      label: 'Demandes de formation',
      value: String(n(stats?.registrations_new)),
      href: '/admin/formations',
      urgent: n(stats?.registrations_new) > 0,
    },
  ];

  const kpis = [
    { label: 'Comptes', value: `${n(stats?.users)} dont ${n(stats?.members)} adhérents` },
    { label: 'Soldes des membres', value: formatFcfa(n(stats?.balances)) },
    { label: 'Dépôts (30 j)', value: formatFcfa(n(stats?.deposits)) },
    { label: 'Adhésions PayDunya (30 j)', value: formatFcfa(n(stats?.memberships)) },
    { label: 'Retraits payés (30 j)', value: formatFcfa(n(stats?.withdrawals_paid)) },
    {
      label: 'Jeux (30 j) : mises − gains',
      value: `${formatFcfa(margin)} sur ${n(stats?.game_rounds)} parties`,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Vue d’ensemble"
        description="Chiffres lus en direct dans la base de données."
        action={
          <Link href="/admin/withdrawals" className="btn btn-primary">
            Traiter les retraits
          </Link>
        }
      />

      {(statsRes.error || recent.error) && <LoadError />}

      <h2 className="mb-4 text-2xl">À traiter</h2>
      <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {todo.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`block border-3 border-ink px-4 py-4 hover:shadow-hard ${t.urgent ? 'bg-acid' : 'bg-paper'}`}
            >
              <span className="eyebrow block !text-ink">{t.label}</span>
              <span className="mt-1 block font-display text-2xl font-black">{t.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mb-4 text-2xl">Indicateurs</h2>
      <dl className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="card-flat">
            <dt className="eyebrow">{k.label}</dt>
            <dd className="mt-2 font-display text-2xl font-black">{k.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-4 text-2xl">Dernières opérations</h2>
      {(recent.data ?? []).length === 0 ? (
        <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucune opération pour l’instant.
        </p>
      ) : (
        <DataTable
          headers={[
            { label: 'Date' },
            { label: 'Type' },
            { label: 'Détail' },
            { label: 'Montant', align: 'right' },
            { label: 'Compte' },
          ]}
        >
          {(recent.data ?? []).map((tx) => (
            <tr key={tx.id}>
              <td className="whitespace-nowrap">{formatDate(tx.created_at)}</td>
              <td>{TX_LABELS[tx.type] ?? tx.type}</td>
              <td>{tx.description}</td>
              <td className="text-right font-semibold whitespace-nowrap">
                {formatFcfa(Number(tx.amount))}
              </td>
              <td>
                <Link href={`/admin/users/${tx.user_id}`} className="underline underline-offset-4">
                  Voir le compte
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
