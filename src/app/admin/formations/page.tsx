import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import ActionButton from '@/components/admin/ActionButton';
import { createClient } from '@/lib/supabase/server';
import { REGISTRATION_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  new: [
    { status: 'contacted', label: 'Marquer contacté' },
    { status: 'cancelled', label: 'Annuler' },
  ],
  contacted: [
    { status: 'enrolled', label: 'Marquer inscrit' },
    { status: 'cancelled', label: 'Annuler' },
  ],
  enrolled: [],
  cancelled: [{ status: 'new', label: 'Rouvrir' }],
};

/** Demandes d'inscription envoyées depuis la page Formations. */
export default async function AdminFormationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('course_registrations')
    .select('id, user_id, full_name, phone, goal, level, formation, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Formations"
        description="Demandes d’inscription reçues. Contacte la personne puis fais avancer le statut."
      />
      {error && <LoadError />}
      {(data ?? []).length === 0 ? (
        <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucune demande pour l’instant.
        </p>
      ) : (
        <DataTable
          minWidth="60rem"
          headers={[
            { label: 'Reçue le' },
            { label: 'Personne' },
            { label: 'Formation' },
            { label: 'Objectif' },
            { label: 'Statut' },
            { label: 'Actions' },
          ]}
        >
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{formatDate(r.created_at)}</td>
              <td>
                {r.full_name}
                <span className="block font-mono text-xs">{r.phone}</span>
                <Link href={`/admin/users/${r.user_id}`} className="text-xs underline">
                  Voir le compte
                </Link>
              </td>
              <td>
                {r.formation}
                <span className="block text-xs text-ink-70">Niveau : {r.level}</span>
              </td>
              <td className="max-w-xs break-words">{r.goal ?? '—'}</td>
              <td>{REGISTRATION_STATUS[r.status]}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {(NEXT_STEPS[r.status] ?? []).map((step) => (
                    <ActionButton
                      key={step.status}
                      url={`/api/admin/registrations/${r.id}`}
                      body={{ status: step.status }}
                      label={step.label}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
