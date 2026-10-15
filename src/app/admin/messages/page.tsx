import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import ActionButton from '@/components/admin/ActionButton';
import { load, requireAdminPage } from '../_lib/load';
import { MESSAGE_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

/** Messages reçus par le formulaire de contact. */
export default async function AdminMessagesPage() {
  await requireAdminPage();
  const { data, error } = await load<{
    id: string;
    name: string;
    email: string | null;
    message: string;
    status: string;
    created_at: Date;
  }>(
    `select id, name, email, message, status, created_at
       from contact_messages
      order by created_at desc
      limit 200`,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Messages"
        description="Réponds par e-mail quand l’adresse est fournie, puis marque le message résolu."
      />
      {error && <LoadError />}
      {(data ?? []).length === 0 ? (
        <p className="border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucun message reçu.
        </p>
      ) : (
        <DataTable
          minWidth="52rem"
          headers={[
            { label: 'Reçu le' },
            { label: 'De' },
            { label: 'Message' },
            { label: 'Statut' },
            { label: 'Actions' },
          ]}
        >
          {(data ?? []).map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap">{formatDate(m.created_at)}</td>
              <td>
                {m.name}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="block text-xs underline">
                    {m.email}
                  </a>
                )}
              </td>
              <td className="max-w-md break-words whitespace-pre-line">{m.message}</td>
              <td>{MESSAGE_STATUS[m.status]}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {m.status !== 'in_progress' && m.status !== 'resolved' && (
                    <ActionButton
                      url={`/api/admin/messages/${m.id}`}
                      body={{ status: 'in_progress' }}
                      label="Prendre en charge"
                    />
                  )}
                  {m.status !== 'resolved' ? (
                    <ActionButton
                      url={`/api/admin/messages/${m.id}`}
                      body={{ status: 'resolved' }}
                      label="Marquer résolu"
                    />
                  ) : (
                    <ActionButton
                      url={`/api/admin/messages/${m.id}`}
                      body={{ status: 'new' }}
                      label="Rouvrir"
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
