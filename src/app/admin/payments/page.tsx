import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import { createClient } from '@/lib/supabase/server';
import { formatFcfa } from '@/lib/config';
import { PAYMENT_KIND, PAYMENT_STATUS } from '@/lib/labels';
import { isPaydunyaConfigured, isPaydunyaLive } from '@/lib/paydunya';

export const dynamic = 'force-dynamic';

/** Paiements entrants PayDunya (dépôts et adhésions). */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && status in PAYMENT_STATUS ? status : null;

  const supabase = await createClient();
  let query = supabase
    .from('payments')
    .select('id, user_id, kind, amount, status, provider_token, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (filter) query = query.eq('status', filter);
  const { data, error } = await query;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Paiements"
        description={
          isPaydunyaConfigured()
            ? `PayDunya actif en mode ${isPaydunyaLive() ? 'production' : 'test (sandbox)'}.`
            : 'PayDunya non configuré : aucun paiement ne peut être encaissé.'
        }
      />

      <nav aria-label="Filtrer par statut" className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/payments"
          className={`border-3 border-ink px-3 py-1.5 font-mono text-xs font-bold uppercase ${!filter ? 'bg-acid' : 'bg-paper'}`}
        >
          Tous
        </Link>
        {Object.entries(PAYMENT_STATUS).map(([id, label]) => (
          <Link
            key={id}
            href={`/admin/payments?status=${id}`}
            className={`border-3 border-ink px-3 py-1.5 font-mono text-xs font-bold uppercase ${filter === id ? 'bg-acid' : 'bg-paper'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {error && <LoadError />}
      {(data ?? []).length === 0 ? (
        <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucun paiement.
        </p>
      ) : (
        <DataTable
          headers={[
            { label: 'Créé le' },
            { label: 'Type' },
            { label: 'Montant', align: 'right' },
            { label: 'Statut' },
            { label: 'Jeton PayDunya' },
            { label: 'Compte' },
          ]}
        >
          {(data ?? []).map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap">{formatDate(p.created_at)}</td>
              <td>{PAYMENT_KIND[p.kind] ?? p.kind}</td>
              <td className="text-right font-semibold whitespace-nowrap">
                {formatFcfa(Number(p.amount))}
              </td>
              <td>
                {PAYMENT_STATUS[p.status] ?? p.status}
                {p.completed_at && (
                  <span className="block text-xs text-ink-70">{formatDate(p.completed_at)}</span>
                )}
              </td>
              <td className="font-mono text-xs break-all">{p.provider_token}</td>
              <td>
                <Link href={`/admin/users/${p.user_id}`} className="underline underline-offset-4">
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
