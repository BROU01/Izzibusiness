import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import { createClient } from '@/lib/supabase/server';
import { findCountry } from '@/lib/auth/countries';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type Filter = 'all' | 'members' | 'non_members' | 'banned' | 'admins';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'members', label: 'Adhérents' },
  { id: 'non_members', label: 'Sans adhésion' },
  { id: 'banned', label: 'Suspendus' },
  { id: 'admins', label: 'Admins' },
];

/** Recherche, filtres et pagination des comptes. */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const params = await searchParams;
  // Caractères réservés de la syntaxe PostgREST retirés de la recherche.
  const q = (params.q ?? '')
    .replace(/[,()*%\\]/g, '')
    .trim()
    .slice(0, 60);
  const filter = (FILTERS.find((f) => f.id === params.filter)?.id ?? 'all') as Filter;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from('profiles')
    .select('id, username, email, phone, country, role, is_member, is_banned, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (filter === 'members') query = query.eq('is_member', true);
  if (filter === 'non_members') query = query.eq('is_member', false);
  if (filter === 'banned') query = query.eq('is_banned', true);
  if (filter === 'admins') query = query.eq('role', 'admin');

  const { data, count, error } = await query;
  const rows = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (next: { filter?: Filter; page?: number }) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const f = next.filter ?? filter;
    if (f !== 'all') sp.set('filter', f);
    if ((next.page ?? 1) > 1) sp.set('page', String(next.page));
    const s = sp.toString();
    return `/admin/users${s ? `?${s}` : ''}`;
  };

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Comptes" description={`${total} compte(s).`} />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <label htmlFor="admin-user-search" className="sr-only">
          Rechercher un compte
        </label>
        <input
          id="admin-user-search"
          name="q"
          defaultValue={q}
          placeholder="Pseudo, e-mail ou téléphone"
          className="input max-w-sm flex-1"
        />
        {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        <button type="submit" className="btn btn-primary">
          Rechercher
        </button>
      </form>

      <nav aria-label="Filtres" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={href({ filter: f.id })}
            aria-current={filter === f.id ? 'page' : undefined}
            className={`border-3 border-ink px-3 py-1.5 font-mono text-xs font-bold uppercase ${filter === f.id ? 'bg-acid' : 'bg-paper'}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {error && <LoadError />}

      {!error && rows.length === 0 ? (
        <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucun compte ne correspond.
        </p>
      ) : (
        <DataTable
          headers={[
            { label: 'Pseudo' },
            { label: 'E-mail' },
            { label: 'Téléphone' },
            { label: 'Pays' },
            { label: 'Statut' },
            { label: 'Inscrit le' },
          ]}
        >
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="font-semibold underline underline-offset-4"
                >
                  {u.username ? `@${u.username}` : 'sans pseudo'}
                </Link>
                {u.role === 'admin' && <span className="badge badge-sky ml-2">Admin</span>}
              </td>
              <td>{u.email ?? '—'}</td>
              <td className="font-mono">{u.phone}</td>
              <td>{findCountry(u.country ?? '')?.name ?? '—'}</td>
              <td className="flex flex-wrap gap-1">
                {u.is_banned && <span className="badge badge-flame">Suspendu</span>}
                {u.is_member ? (
                  <span className="badge badge-grass">Adhérent</span>
                ) : (
                  <span className="badge">Inscrit</span>
                )}
              </td>
              <td className="whitespace-nowrap">{formatDate(u.created_at, false)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          {page > 1 && (
            <Link href={href({ page: page - 1 })} className="btn btn-ghost">
              Page précédente
            </Link>
          )}
          <span className="font-mono text-sm">
            Page {page} / {pages}
          </span>
          {page < pages && (
            <Link href={href({ page: page + 1 })} className="btn btn-ghost">
              Page suivante
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
