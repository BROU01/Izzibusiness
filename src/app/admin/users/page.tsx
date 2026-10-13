import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { findCountry } from '@/lib/auth/countries';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** Liste des comptes (50 plus récents). Données personnelles : admin uniquement. */
export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from('profiles')
    .select('id, username, email, phone, country, role, is_member, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  const rows = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Comptes"
        description={`${count ?? 0} compte(s) au total. Affichage des ${PAGE_SIZE} plus récents.`}
      />

      {error && (
        <p role="alert" className="mb-6 border-3 border-ink bg-[#ffe1d6] px-4 py-3 font-semibold">
          Impossible de charger les comptes. Recharge la page.
        </p>
      )}

      {!error && rows.length === 0 ? (
        <EmptyState
          title="Aucun compte"
          description="Les comptes apparaîtront ici après les premières inscriptions."
        />
      ) : (
        <div className="overflow-x-auto border-3 border-ink">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Pseudo</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t-2 border-ink">
                  <td className="px-4 py-3 font-semibold">
                    {u.username ? `@${u.username}` : 'sans pseudo'}
                    {u.role === 'admin' && <span className="badge badge-sky ml-2">Admin</span>}
                  </td>
                  <td className="px-4 py-3">{u.email ?? 'non renseigné'}</td>
                  <td className="px-4 py-3 font-mono">{u.phone}</td>
                  <td className="px-4 py-3">
                    {findCountry(u.country ?? '')?.name ?? 'non renseigné'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_member ? (
                      <span className="badge badge-grass">Adhérent</span>
                    ) : (
                      <span className="badge">Inscrit</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
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
