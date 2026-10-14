import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import ActionButton from '@/components/admin/ActionButton';
import InputAction from '@/components/admin/InputAction';
import { createClient } from '@/lib/supabase/server';
import { WITHDRAW_OPERATORS, formatFcfa } from '@/lib/config';
import { WITHDRAWAL_STATUS } from '@/lib/labels';
import { isPaydunyaConfigured } from '@/lib/paydunya';

export const dynamic = 'force-dynamic';

const OPERATOR_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(WITHDRAW_OPERATORS)
    .flat()
    .map((o) => [o.mode, o.label]),
);

/** Retraits : file d'attente d'abord, puis historique récent. */
export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const [pending, history] = await Promise.all([
    supabase
      .from('withdrawals')
      .select('id, user_id, amount, fee, phone, withdraw_mode, status, admin_note, created_at')
      .in('status', ['requested', 'processing'])
      .order('created_at', { ascending: true }),
    supabase
      .from('withdrawals')
      .select('id, user_id, amount, phone, withdraw_mode, status, admin_note, updated_at')
      .in('status', ['paid', 'rejected', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(50),
  ]);
  const paydunya = isPaydunyaConfigured();

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Retraits"
        description="Le montant et les frais sont bloqués dès la demande. « Payer » envoie l’argent par PayDunya ; « Refuser » rembourse le membre."
      />
      {!paydunya && (
        <p className="mb-6 border-3 border-ink bg-acid px-4 py-3 font-semibold">
          PayDunya n’est pas configuré : le bouton « Payer » échouera tant que les clés ne sont pas
          renseignées (voir docs/paydunya.md).
        </p>
      )}
      {(pending.error || history.error) && <LoadError />}

      <h2 className="mb-4 text-2xl">À traiter ({(pending.data ?? []).length})</h2>
      {(pending.data ?? []).length === 0 ? (
        <p className="mb-10 border-3 border-dashed border-ink px-4 py-6 text-center text-ink-70">
          Aucun retrait en attente.
        </p>
      ) : (
        <div className="mb-10">
          <DataTable
            minWidth="60rem"
            headers={[
              { label: 'Demandé le' },
              { label: 'Compte' },
              { label: 'Envoi', align: 'right' },
              { label: 'Vers' },
              { label: 'Statut' },
              { label: 'Actions' },
            ]}
          >
            {(pending.data ?? []).map((w) => (
              <tr key={w.id}>
                <td className="whitespace-nowrap">{formatDate(w.created_at)}</td>
                <td>
                  <Link href={`/admin/users/${w.user_id}`} className="underline underline-offset-4">
                    Voir le compte
                  </Link>
                </td>
                <td className="text-right font-semibold whitespace-nowrap">
                  {formatFcfa(Number(w.amount))}
                  <span className="block text-xs font-normal text-ink-70">
                    frais {formatFcfa(Number(w.fee))}
                  </span>
                </td>
                <td>
                  <span className="font-mono">{w.phone}</span>
                  <span className="block text-xs">
                    {OPERATOR_LABEL[w.withdraw_mode] ?? w.withdraw_mode}
                  </span>
                </td>
                <td>
                  {WITHDRAWAL_STATUS[w.status]}
                  {w.admin_note && (
                    <span className="block text-xs text-ink-70">{w.admin_note}</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap items-start gap-2">
                    {w.status === 'requested' ? (
                      <>
                        <ActionButton
                          url={`/api/admin/withdrawals/${w.id}`}
                          body={{ action: 'pay' }}
                          label={`Payer ${formatFcfa(Number(w.amount))}`}
                          pendingLabel="Envoi PayDunya…"
                          variant="primary"
                          confirmText={`Envoyer ${formatFcfa(Number(w.amount))} au ${w.phone} via PayDunya ?`}
                        />
                        <InputAction
                          url={`/api/admin/withdrawals/${w.id}`}
                          label="Refuser"
                          submitLabel="Refuser et rembourser"
                          fields={[{ name: 'note', label: 'Motif communiqué au membre' }]}
                          buildBody={(v) => ({ action: 'reject', note: v.note ?? '' })}
                        />
                      </>
                    ) : (
                      <ActionButton
                        url={`/api/admin/withdrawals/${w.id}`}
                        body={{ action: 'refresh' }}
                        label="Vérifier le statut"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <h2 className="mb-4 text-2xl">Historique</h2>
      {(history.data ?? []).length === 0 ? (
        <p className="text-ink-70">Aucun retrait clôturé.</p>
      ) : (
        <DataTable
          minWidth="44rem"
          headers={[
            { label: 'Date' },
            { label: 'Montant', align: 'right' },
            { label: 'Vers' },
            { label: 'Statut' },
            { label: 'Compte' },
          ]}
        >
          {(history.data ?? []).map((w) => (
            <tr key={w.id}>
              <td className="whitespace-nowrap">{formatDate(w.updated_at)}</td>
              <td className="text-right whitespace-nowrap">{formatFcfa(Number(w.amount))}</td>
              <td className="font-mono">{w.phone}</td>
              <td>
                {WITHDRAWAL_STATUS[w.status]}
                {w.admin_note && <span className="block text-xs text-ink-70">{w.admin_note}</span>}
              </td>
              <td>
                <Link href={`/admin/users/${w.user_id}`} className="underline underline-offset-4">
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
