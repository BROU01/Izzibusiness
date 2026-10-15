import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { formatDate } from '@/components/admin/DataTable';
import ActionButton from '@/components/admin/ActionButton';
import InputAction from '@/components/admin/InputAction';
import { load, requireAdminPage } from '../../_lib/load';
import { findCountry } from '@/lib/auth/countries';
import { formatFcfa } from '@/lib/config';
import { GAME_LABELS, ROUND_STATUS, WITHDRAWAL_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

/** Fiche d'un compte : profil, solde, opérations, parties, retraits, actions admin. */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdminPage();
  const { id } = await params;
  // Identifiant Better Auth (chaîne aléatoire, pas un UUID).
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) notFound();

  const [profileRes, walletRes, txRes, roundsRes, wdRes] = await Promise.all([
    load<{
      id: string;
      username: string | null;
      email: string | null;
      phone: string;
      country: string | null;
      role: string;
      is_member: boolean;
      is_banned: boolean;
      referral_code: string | null;
      referred_by: string | null;
      games_accepted_at: Date | null;
      created_at: Date;
    }>(
      `select p.id, u.username, u.email, p.phone, p.country, p.role, p.is_member, p.is_banned,
              p.referral_code, p.referred_by, p.games_accepted_at, p.created_at
         from profiles p
         join "user" u on u.id = p.id
        where p.id = $1`,
      [id],
    ),
    load<{ balance: string }>('select balance from wallets where user_id = $1', [id]),
    load<{
      id: string;
      type: string;
      amount: string;
      balance_after: string;
      description: string | null;
      created_at: Date;
    }>(
      `select id, type, amount, balance_after, description, created_at
         from transactions
        where user_id = $1
        order by created_at desc
        limit 30`,
      [id],
    ),
    load<{
      id: string;
      game: string;
      bet: string;
      status: string;
      multiplier: string;
      payout: string;
      started_at: Date;
    }>(
      `select id, game, bet, status, multiplier, payout, started_at
         from game_rounds
        where user_id = $1
        order by started_at desc
        limit 10`,
      [id],
    ),
    load<{ id: string; amount: string; status: string; created_at: Date }>(
      `select id, amount, status, created_at
         from withdrawals
        where user_id = $1
        order by created_at desc
        limit 10`,
      [id],
    ),
  ]);

  const p = profileRes.data[0];
  if (!p) notFound();
  const url = `/api/admin/users/${id}`;
  const isSelf = me.id === id;

  return (
    <div>
      <p className="mb-4">
        <Link
          href="/admin/users"
          className="font-mono text-xs uppercase underline underline-offset-4"
        >
          Retour aux comptes
        </Link>
      </p>
      <PageHeader
        eyebrow="Compte"
        title={p.username ? `@${p.username}` : 'Compte sans pseudo'}
        description={`Inscrit le ${formatDate(p.created_at, false)}`}
      />

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-xl">Profil</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold">E-mail</dt>
            <dd>{p.email ?? '—'}</dd>
            <dt className="font-semibold">Téléphone</dt>
            <dd className="font-mono">{p.phone}</dd>
            <dt className="font-semibold">Pays</dt>
            <dd>{findCountry(p.country ?? '')?.name ?? '—'}</dd>
            <dt className="font-semibold">Rôle</dt>
            <dd>{p.role === 'admin' ? 'Administrateur' : 'Membre'}</dd>
            <dt className="font-semibold">Adhésion</dt>
            <dd>{p.is_member ? 'Active' : 'Non réglée'}</dd>
            <dt className="font-semibold">Jeux</dt>
            <dd>
              {p.games_accepted_at
                ? `Règles acceptées le ${formatDate(p.games_accepted_at, false)}`
                : 'Pas encore accepté'}
            </dd>
            <dt className="font-semibold">Code parrain</dt>
            <dd className="font-mono">{p.referral_code ?? '—'}</dd>
            <dt className="font-semibold">Parrainé par</dt>
            <dd className="font-mono">{p.referred_by ?? '—'}</dd>
            <dt className="font-semibold">Statut</dt>
            <dd>{p.is_banned ? 'Suspendu' : 'Actif'}</dd>
          </dl>
        </section>

        <section className="card">
          <h2 className="text-xl">Solde</h2>
          <p className="mt-2 font-display text-4xl font-black">
            {formatFcfa(Number(walletRes.data[0]?.balance ?? 0))}
          </p>
          <div className="mt-6 flex flex-wrap items-start gap-2">
            <ActionButton
              url={url}
              body={{ action: 'set_member', value: !p.is_member }}
              label={p.is_member ? 'Retirer l’adhésion' : 'Activer l’adhésion'}
              confirmText={p.is_member ? 'Retirer l’adhésion de ce compte ?' : undefined}
            />
            {!isSelf && (
              <>
                <ActionButton
                  url={url}
                  body={{ action: 'set_banned', value: !p.is_banned }}
                  label={p.is_banned ? 'Réactiver le compte' : 'Suspendre le compte'}
                  confirmText={
                    p.is_banned ? undefined : 'Suspendre ce compte ? Il ne pourra plus rien faire.'
                  }
                />
                <ActionButton
                  url={url}
                  body={{ action: 'set_role', value: p.role === 'admin' ? 'user' : 'admin' }}
                  label={p.role === 'admin' ? 'Retirer le rôle admin' : 'Nommer administrateur'}
                  confirmText="Changer le rôle de ce compte ?"
                />
              </>
            )}
            <InputAction
              url={url}
              label="Ajuster le solde"
              submitLabel="Appliquer l’ajustement"
              fields={[
                {
                  name: 'amount',
                  label: 'Montant (négatif pour débiter)',
                  type: 'number',
                  placeholder: 'ex. 500 ou -500',
                },
                { name: 'reason', label: 'Motif (obligatoire, visible dans l’historique)' },
              ]}
              buildBody={(v) => ({
                action: 'adjust_balance',
                amount: Number((v.amount ?? '').replace(/[^\d-]/g, '')),
                reason: v.reason ?? '',
              })}
            />
          </div>
        </section>
      </div>

      <h2 className="mb-4 text-2xl">Opérations</h2>
      {(txRes.data ?? []).length === 0 ? (
        <p className="mb-10 text-ink-70">Aucune opération.</p>
      ) : (
        <div className="mb-10">
          <DataTable
            minWidth="36rem"
            headers={[
              { label: 'Date' },
              { label: 'Détail' },
              { label: 'Montant', align: 'right' },
              { label: 'Solde après', align: 'right' },
            ]}
          >
            {(txRes.data ?? []).map((tx) => (
              <tr key={tx.id}>
                <td className="whitespace-nowrap">{formatDate(tx.created_at)}</td>
                <td>{tx.description ?? tx.type}</td>
                <td className="text-right font-semibold whitespace-nowrap">
                  {formatFcfa(Number(tx.amount))}
                </td>
                <td className="text-right whitespace-nowrap">
                  {formatFcfa(Number(tx.balance_after))}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-2xl">Parties récentes</h2>
          {(roundsRes.data ?? []).length === 0 ? (
            <p className="text-ink-70">Aucune partie.</p>
          ) : (
            <DataTable
              minWidth="24rem"
              headers={[
                { label: 'Jeu' },
                { label: 'Mise', align: 'right' },
                { label: 'Gain', align: 'right' },
              ]}
            >
              {(roundsRes.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td>
                    {GAME_LABELS[r.game] ?? r.game} · {ROUND_STATUS[r.status] ?? r.status}
                  </td>
                  <td className="text-right">{formatFcfa(Number(r.bet))}</td>
                  <td className="text-right">{formatFcfa(Number(r.payout))}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-2xl">Retraits</h2>
          {(wdRes.data ?? []).length === 0 ? (
            <p className="text-ink-70">Aucun retrait.</p>
          ) : (
            <DataTable
              minWidth="24rem"
              headers={[
                { label: 'Date' },
                { label: 'Montant', align: 'right' },
                { label: 'Statut' },
              ]}
            >
              {(wdRes.data ?? []).map((w) => (
                <tr key={w.id}>
                  <td>{formatDate(w.created_at, false)}</td>
                  <td className="text-right">{formatFcfa(Number(w.amount))}</td>
                  <td>{WITHDRAWAL_STATUS[w.status] ?? w.status}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      </div>
    </div>
  );
}
