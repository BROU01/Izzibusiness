import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatFcfa, ADHESION_FEE, MIN_WITHDRAWAL } from '@/lib/config';

// Chiffres affichés = caractéristiques vérifiables du produit uniquement
// (config.ts, structure du catalogue). Aucune donnée d'usage fictive
// (utilisateurs, montants versés, taux) tant qu'aucune source réelle n'existe.

const facts = [
  {
    value: '20',
    label: 'Jours de parcours guidé',
    desc: 'Un programme étape par étape : activité, exercice et critère de validation chaque jour.',
  },
  {
    value: '1×',
    label: `Adhésion unique — ${formatFcfa(ADHESION_FEE)}`,
    desc: 'Un seul paiement pour accéder au catalogue. Le détail est affiché avant confirmation.',
  },
  {
    value: '0 %',
    label: 'Commission marketplace',
    desc: 'Vends tes produits et services entre membres sans commission prélevée par la plateforme.',
  },
];

export default function About() {
  return (
    <>
      <Navbar />
      <section className="section">
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="eyebrow">[ À propos ]</p>
          <h1 className="mt-3 font-serif text-4xl font-black md:text-5xl">
            Un espace pour apprendre, pratiquer et suivre ta progression.
          </h1>

          <p className="mt-6 text-base leading-relaxed text-ink-60">
            Izzibusiness aide ses membres à développer des compétences monétisables, accéder à des
            formations structurées, réaliser des missions, proposer des offres et suivre leurs
            résultats au même endroit.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-60">
            Ce que nous affichons est ce que nous appliquons : prix exacts avant paiement, règles de
            retrait lisibles, historique de wallet consultable et aucune promesse de gains. Les
            résultats dépendent de ton activité, de tes compétences et des opportunités disponibles.
          </p>

          <div className="grid-3 gap-6" style={{ marginTop: '40px' }}>
            {facts.map((f) => (
              <div key={f.label} className="card">
                <div className="font-serif text-3xl font-black text-flame">{f.value}</div>
                <div className="mt-1 font-mono text-xs font-bold uppercase tracking-wide">
                  {f.label}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-60">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="card mt-10" style={{ background: 'var(--paper-2)' }}>
            <p className="eyebrow">[ Statut de la plateforme ]</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-60">
              Izzibusiness vient d&apos;ouvrir : les premiers membres construisent actuellement
              leurs parcours. Les statistiques d&apos;usage et les retours vérifiés — publiés avec
              l&apos;accord de leurs auteurs — apparaîtront ici dès qu&apos;ils seront réels.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/formations" className="btn btn-primary">
              Voir le programme
            </a>
            <a href="/contact" className="btn btn-ghost">
              Poser une question
            </a>
          </div>
          <p className="mt-3 font-mono text-xs text-ink-60">
            Retrait mobile money dès {formatFcfa(MIN_WITHDRAWAL)} · Montants affichés avant chaque
            confirmation
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
