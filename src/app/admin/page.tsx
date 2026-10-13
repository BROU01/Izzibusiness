import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { formatFcfa } from '@/lib/config';

export const dynamic = 'force-dynamic';

const TX_LABELS: Record<string, string> = {
  deposit: 'Dépôt',
  withdraw: 'Retrait',
  game_bet: 'Mise',
  game_win: 'Gain jeu',
  mission_reward: 'Mission',
  referral_bonus: 'Parrainage',
  purchase: 'Achat',
};

/**
 * Vue d'ensemble admin. Les chiffres viennent de la base (policies
 * is_admin() de la migration 006) ; l'accès à /admin est filtré par le proxy.
 */
export default async function AdminDashboard() {
  const supabase = await createClient();

  const [users, members, wallets, recent] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_member', true),
    supabase.from('wallets').select('balance'),
    supabase
      .from('transactions')
      .select('id, type, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const totalBalance = (wallets.data ?? []).reduce((sum, w) => sum + Number(w.balance ?? 0), 0);
  const failed = [users, members, wallets, recent].some((r) => r.error);

  const stats = [
    { label: 'Comptes inscrits', value: String(users.count ?? 0) },
    { label: 'Adhérents', value: String(members.count ?? 0) },
    { label: 'Soldes cumulés', value: formatFcfa(totalBalance) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Vue d’ensemble"
        description="Chiffres lus en direct dans la base de données."
        action={
          <Link href="/admin/users" className="btn btn-primary">
            Gérer les comptes
          </Link>
        }
      />

      {failed && (
        <p role="alert" className="mb-6 border-3 border-ink bg-[#ffe1d6] px-4 py-3 font-semibold">
          Certaines données n’ont pas pu être chargées. Recharge la page.
        </p>
      )}

      <dl className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card-flat">
            <dt className="eyebrow">{stat.label}</dt>
            <dd className="mt-2 font-display text-3xl font-black">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-4 text-2xl">Dernières transactions</h2>
      {(recent.data ?? []).length === 0 ? (
        <EmptyState
          title="Aucune transaction"
          description="Les dépôts, retraits et achats apparaîtront ici dès les premiers paiements PayDunya."
        />
      ) : (
        <div className="overflow-x-auto border-3 border-ink">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((tx) => (
                <tr key={tx.id} className="border-t-2 border-ink">
                  <td className="px-4 py-3">
                    {new Date(tx.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3">{TX_LABELS[tx.type] ?? tx.type}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatFcfa(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-3">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
