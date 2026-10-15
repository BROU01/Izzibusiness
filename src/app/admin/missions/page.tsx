import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import ActionButton from '@/components/admin/ActionButton';
import InputAction from '@/components/admin/InputAction';
import { load, requireAdminPage } from '../_lib/load';
import { formatFcfa } from '@/lib/config';
import { MISSION_STATUS } from '@/lib/labels';
import MissionForm from './MissionForm';

export const dynamic = 'force-dynamic';

/** Missions : preuves à vérifier, création, liste et publication. */
export default async function AdminMissionsPage() {
  await requireAdminPage();
  const [missions, pending] = await Promise.all([
    load<{
      id: string;
      title: string;
      reward: string;
      status: string;
      max_completions: number | null;
      created_at: Date;
    }>(
      `select id, title, reward, status, max_completions, created_at
         from missions
        order by created_at desc`,
    ),
    load<{
      id: string;
      mission_id: string;
      user_id: string;
      proof: string;
      created_at: Date;
      mission_title: string | null;
      mission_reward: string | null;
    }>(
      `select s.id, s.mission_id, s.user_id, s.proof, s.created_at,
              m.title as mission_title, m.reward as mission_reward
         from mission_submissions s
         left join missions m on m.id = s.mission_id
        where s.status = 'pending'
        order by s.created_at asc
        limit 100`,
    ),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Missions"
        description="Valider une preuve crédite immédiatement la récompense sur le wallet du membre."
      />
      {(missions.error || pending.error) && <LoadError />}

      <h2 className="mb-4 text-2xl">Preuves à vérifier ({(pending.data ?? []).length})</h2>
      {(pending.data ?? []).length === 0 ? (
        <p className="mb-10 border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucune preuve en attente.
        </p>
      ) : (
        <div className="mb-10">
          <DataTable
            minWidth="56rem"
            headers={[
              { label: 'Reçue le' },
              { label: 'Mission' },
              { label: 'Preuve' },
              { label: 'Compte' },
              { label: 'Décision' },
            ]}
          >
            {(pending.data ?? []).map((s) => {
              const mission =
                s.mission_title === null
                  ? null
                  : { title: s.mission_title, reward: s.mission_reward };
              return (
                <tr key={s.id}>
                  <td className="whitespace-nowrap">{formatDate(s.created_at)}</td>
                  <td>
                    {mission?.title}
                    <span className="block text-xs">
                      {formatFcfa(Number(mission?.reward ?? 0))}
                    </span>
                  </td>
                  <td className="max-w-sm break-words whitespace-pre-line">{s.proof}</td>
                  <td>
                    <Link
                      href={`/admin/users/${s.user_id}`}
                      className="underline underline-offset-4"
                    >
                      Voir
                    </Link>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-start gap-2">
                      <ActionButton
                        url={`/api/admin/submissions/${s.id}`}
                        body={{ approve: true }}
                        label="Valider et payer"
                        variant="primary"
                      />
                      <InputAction
                        url={`/api/admin/submissions/${s.id}`}
                        label="Refuser"
                        submitLabel="Confirmer le refus"
                        fields={[{ name: 'note', label: 'Motif communiqué au membre' }]}
                        buildBody={(v) => ({ approve: false, note: v.note ?? '' })}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
      )}

      <div className="mb-10">
        <MissionForm />
      </div>

      <h2 className="mb-4 text-2xl">Toutes les missions</h2>
      {(missions.data ?? []).length === 0 ? (
        <p className="text-ink-70">Aucune mission créée.</p>
      ) : (
        <DataTable
          minWidth="44rem"
          headers={[
            { label: 'Mission' },
            { label: 'Récompense', align: 'right' },
            { label: 'Statut' },
            { label: 'Actions' },
          ]}
        >
          {(missions.data ?? []).map((m) => (
            <tr key={m.id}>
              <td>
                {m.title}
                <span className="block text-xs text-ink-70">
                  Créée le {formatDate(m.created_at, false)}
                  {m.max_completions ? ` · ${m.max_completions} validations max.` : ''}
                </span>
              </td>
              <td className="text-right">{formatFcfa(Number(m.reward))}</td>
              <td>{MISSION_STATUS[m.status]}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {m.status !== 'open' && (
                    <ActionButton
                      url={`/api/admin/missions/${m.id}`}
                      body={{ status: 'open' }}
                      label="Publier"
                    />
                  )}
                  {m.status === 'open' && (
                    <ActionButton
                      url={`/api/admin/missions/${m.id}`}
                      body={{ status: 'closed' }}
                      label="Clôturer"
                      confirmText="Clôturer cette mission ? Les membres ne pourront plus envoyer de preuve."
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
