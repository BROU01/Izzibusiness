import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import { load, requireAdminPage } from '../_lib/load';
import { GAME_RTP, MAX_BET, MIN_BET, formatFcfa } from '@/lib/config';
import { GAME_LABELS, ROUND_STATUS } from '@/lib/labels';
import GameToggles from './GameToggles';

export const dynamic = 'force-dynamic';

/** Début de la fenêtre de 30 jours (calculé à chaque requête : page dynamique). */
function windowStart(): string {
  return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
}

/** Jeux : ouverture, résultats par jeu sur 30 jours, dernières parties. */
export default async function AdminGamesPage() {
  await requireAdminPage();
  const since = windowStart();
  const [settings, rounds, recent] = await Promise.all([
    load<{ value: Record<string, boolean> }>(
      "select value from app_settings where key = 'games_enabled'",
    ),
    // Agrégats calculés en base (plus de plafond de 50 000 lignes lues).
    load<{ game: string; count: number; bets: string; payouts: string }>(
      `select game, count(*)::int as count,
              coalesce(sum(bet), 0) as bets, coalesce(sum(payout), 0) as payouts
         from game_rounds
        where started_at >= $1
        group by game`,
      [since],
    ),
    load<{
      id: string;
      user_id: string;
      game: string;
      bet: string;
      status: string;
      multiplier: string;
      payout: string;
      started_at: Date;
    }>(
      `select id, user_id, game, bet, status, multiplier, payout, started_at
         from game_rounds
        order by started_at desc
        limit 30`,
    ),
  ]);

  const enabled = settings.data[0]?.value ?? {};
  const perGame = ['aviator', 'spin', 'apple'].map((game) => {
    const row = rounds.data.find((r) => r.game === game);
    const bets = Number(row?.bets ?? 0);
    const payouts = Number(row?.payouts ?? 0);
    const count = row?.count ?? 0;
    return { game, count, bets, payouts, rtp: bets > 0 ? payouts / bets : null };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Jeux"
        description={`Mises de ${formatFcfa(MIN_BET)} à ${formatFcfa(MAX_BET)}. Retour joueur théorique : ${Math.round(GAME_RTP * 100)} %. Règles dans src/lib/config.ts.`}
      />
      {(settings.error || rounds.error || recent.error) && <LoadError />}

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Ouverture</h2>
        <GameToggles
          initial={{
            spin: enabled.spin === true,
            apple: enabled.apple === true,
            aviator: enabled.aviator === true,
          }}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">30 derniers jours</h2>
        <DataTable
          minWidth="40rem"
          headers={[
            { label: 'Jeu' },
            { label: 'Parties', align: 'right' },
            { label: 'Mises', align: 'right' },
            { label: 'Gains versés', align: 'right' },
            { label: 'Marge', align: 'right' },
            { label: 'Retour observé', align: 'right' },
          ]}
        >
          {perGame.map((g) => (
            <tr key={g.game}>
              <td className="font-semibold">{GAME_LABELS[g.game]}</td>
              <td className="text-right">{g.count}</td>
              <td className="text-right">{formatFcfa(g.bets)}</td>
              <td className="text-right">{formatFcfa(g.payouts)}</td>
              <td className="text-right font-semibold">{formatFcfa(g.bets - g.payouts)}</td>
              <td className="text-right">
                {g.rtp === null ? '—' : `${(g.rtp * 100).toFixed(1).replace('.', ',')} %`}
              </td>
            </tr>
          ))}
        </DataTable>
        <p className="mt-2 text-sm text-ink-70">
          Sur peu de parties, le retour observé varie fortement autour de la valeur théorique.
        </p>
      </section>

      <h2 className="mb-4 text-2xl">Dernières parties</h2>
      {(recent.data ?? []).length === 0 ? (
        <p className="text-ink-70">Aucune partie jouée.</p>
      ) : (
        <DataTable
          headers={[
            { label: 'Date' },
            { label: 'Jeu' },
            { label: 'Mise', align: 'right' },
            { label: 'Résultat' },
            { label: 'Gain', align: 'right' },
            { label: 'Compte' },
          ]}
        >
          {(recent.data ?? []).map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{formatDate(r.started_at)}</td>
              <td>{GAME_LABELS[r.game]}</td>
              <td className="text-right">{formatFcfa(Number(r.bet))}</td>
              <td>
                {ROUND_STATUS[r.status]}
                {r.status === 'won' && ` (×${Number(r.multiplier).toLocaleString('fr-FR')})`}
              </td>
              <td className="text-right">{formatFcfa(Number(r.payout))}</td>
              <td>
                <Link href={`/admin/users/${r.user_id}`} className="underline underline-offset-4">
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
