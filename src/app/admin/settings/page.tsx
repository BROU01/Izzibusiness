import PageHeader from '@/components/ui/PageHeader';
import {
  ADHESION_FEE,
  MIN_DEPOSIT,
  MIN_WITHDRAWAL,
  REFERRAL_BONUS,
  WITHDRAWAL_FEE_RATE,
  formatFcfa,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Paramètres en lecture seule : les règles métier sont versionnées dans
 * src/lib/config.ts et les clés dans les variables d'environnement. Les
 * anciens formulaires « Sauvegarder » n'enregistraient rien.
 */
export default function AdminSettingsPage() {
  const rules = [
    { label: 'Adhésion', value: formatFcfa(ADHESION_FEE) },
    { label: 'Dépôt minimum', value: formatFcfa(MIN_DEPOSIT) },
    { label: 'Retrait minimum', value: formatFcfa(MIN_WITHDRAWAL) },
    {
      label: 'Frais de retrait',
      value: `${(WITHDRAWAL_FEE_RATE * 100).toLocaleString('fr-FR')} %`,
    },
    { label: 'Bonus parrainage', value: formatFcfa(REFERRAL_BONUS) },
  ];

  const services = [
    {
      label: 'Supabase (service_role)',
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    { label: 'URL publique (NEXT_PUBLIC_APP_URL)', ok: Boolean(process.env.NEXT_PUBLIC_APP_URL) },
    { label: 'E-mails Resend', ok: Boolean(process.env.RESEND_API_KEY) },
    { label: 'Paiements PayDunya', ok: false, note: 'Intégration en cours' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Paramètres"
        description={
          <>
            Les règles se modifient dans <code className="font-mono">src/lib/config.ts</code>, les
            clés dans les variables d’environnement de l’hébergeur.
          </>
        }
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Règles métier</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((r) => (
            <div key={r.label} className="card-flat">
              <dt className="eyebrow">{r.label}</dt>
              <dd className="mt-2 font-display text-2xl font-black">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Services connectés</h2>
        <ul className="border-3 border-ink">
          {services.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-4 border-b-2 border-ink px-4 py-3 last:border-b-0"
            >
              <span>{s.label}</span>
              <span className={`badge ${s.ok ? 'badge-grass' : ''}`}>
                {s.ok ? 'Configuré' : (s.note ?? 'Non configuré')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
