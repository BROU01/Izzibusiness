import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { LoadError, formatDate } from '@/components/admin/DataTable';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();
  const since = windowStart();
  const [settings, rounds, recent] = await Promise.all([
    supabase.from('app_settings').select('value').eq('key', 'games_enabled').maybeSingle(),
    supabase.from('game_rounds').select('game, bet, payout').gte('started_at', since).limit(50000),
    supabase
      .from('game_rounds')
      .select('id, user_id, game, bet, status, multiplier, payout, started_at')
      .order('started_at', { ascending: false })
      .limit(30),
  ]);

  const enabled = (settings.data?.value ?? {}) as Record<string, boolean>;
  const perGame = ['aviator', 'spin', 'apple'].map((game) => {
    const rows = (rounds.data ?? []).filter((r) => r.game === game);
    const bets = rows.reduce((s, r) => s + Number(r.bet), 0);
    const payouts = rows.reduce((s, r) => s + Number(r.payout), 0);
    return { game, count: rows.length, bets, payouts, rtp: bets > 0 ? payouts / bets : null };
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
