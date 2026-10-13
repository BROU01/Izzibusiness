import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatFcfa, ADHESION_FEE, MIN_WITHDRAWAL, REFERRAL_BONUS } from '@/lib/config';

// -- Page d'accueil --
// Framework Trust & Conversion (voir CODEBUFF_BRIEF) : 1 promesse → 1 preuve → 1 action.
// Aucune donnée fictive : les chiffres affichés viennent de src/lib/config.ts
// (source de vérité unique) ou décrivent des caractéristiques vérifiables du produit.
// Interdits ici : compteurs d'utilisateurs, témoignages inventés, promesses de gains.

const steps = [
  {
    num: '01',
    title: 'Choisis ton point de départ',
    desc: 'Formation, missions ou vente : commence par ce qui correspond à ton objectif du moment.',
  },
  {
    num: '02',
    title: 'Avance avec un plan clair',
    desc: 'Chaque étape indique quoi faire, combien de temps y consacrer et comment valider ta progression.',
  },
  {
    num: '03',
    title: 'Applique et suis tes résultats',
    desc: 'Missions, offres et progression sont visibles dans ton tableau de bord, en temps réel.',
  },
];

const services = [
  {
    title: 'Formations',
    desc: 'Formations courtes et pratiques pour développer une compétence monétisable, étape par étape.',
    href: '/formations',
    price: `Adhésion ${formatFcfa(ADHESION_FEE)}`,
  },
  {
    title: 'Missions payées',
    desc: 'Petites missions concrètes : likes, partages, commentaires, inscriptions, avis. Rémunération affichée avant de candidater.',
    href: '/dashboard/missions',
    price: 'Rémunération par mission',
  },
  {
    title: 'Marketplace',
    desc: 'Propose ou achète des produits et services numériques directement entre membres.',
    href: '/market',
    price: '0 % de commission',
  },
  {
    title: 'Affiliation',
    desc: 'Invites tes contacts et reçois un bonus quand leur adhésion est confirmée.',
    href: '/dashboard/referrals',
    price: `${formatFcfa(REFERRAL_BONUS)} par filleul actif`,
  },
  {
    title: 'Mini-jeux',
    desc: 'Des parties rapides avec un solde de jeux distinct de ton solde principal. En refonte : chaque résultat sera tiré par le serveur. Gains jamais garantis.',
    href: '/games',
    price: 'En maintenance',
  },
  {
    title: 'Formation IA',
    desc: "Un module complet sur l'intelligence artificielle appliquée à tes projets.",
    href: '/formation-ia',
    price: "Incluse dans l'adhésion",
  },
];

const trustModules = [
  {
    title: 'Prix affiché avant paiement',
    desc: `Le montant exact — ${formatFcfa(ADHESION_FEE)}, paiement unique — est visible avant toute confirmation. Aucun prélèvement caché.`,
  },
  {
    title: 'Wallet consultable',
    desc: `Solde, dépôts et retraits suivis dans ton espace. Retrait vers mobile money dès ${formatFcfa(MIN_WITHDRAWAL)}.`,
  },
  {
    title: 'Support humain',
    desc: 'Une équipe répond à tes questions, pas un robot. Accès depuis ton espace.',
  },
  {
    title: 'Aucun gain garanti',
    desc: 'Les résultats dépendent de ton activité, de tes compétences et des opportunités disponibles. Nous affichons des règles, pas des promesses.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar />

      {/* ===== Hero : masthead de journal ===== */}
      <section className="border-b-3 border-ink" aria-labelledby="hero-title">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/30 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-60">
            <span>Apprendre · Agir · Progresser</span>
            <span>Édition {new Date().getFullYear()}</span>
          </div>

          <div className="grid items-end gap-10 py-14 md:grid-cols-[1.5fr_1fr] md:py-20 [&>*]:min-w-0">
            <div>
              <p className="eyebrow">[ 01 ] — Apprendre, agir, progresser</p>
              <h1
                id="hero-title"
                className="mt-5 font-serif text-[2.4rem] font-black sm:text-5xl leading-[1.02] tracking-tight md:text-7xl"
              >
                Construis des compétences qui{' '}
                <span className="bg-acid px-1 box-decoration-clone">
                  peuvent devenir des revenus
                </span>
                .
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-60">
                Un parcours guidé, des missions et des outils pour passer de l&apos;apprentissage à
                l&apos;action, à ton rythme.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/formations" className="btn btn-primary">
                  Découvrir le parcours
                </Link>
                <Link href="#fonctionnement" className="btn btn-ghost">
                  Voir comment ça fonctionne
                </Link>
              </div>
              <p className="mt-4 font-mono text-xs text-ink-60">
                Inscription gratuite · Aucun paiement n&apos;est déclenché à cette étape
              </p>
            </div>

            {/* Encadré tarifaire : chiffres issus de src/lib/config.ts uniquement */}
            <aside className="card bg-paper p-6" aria-label="Conditions d'accès">
              <p className="eyebrow">Avant de t&apos;engager</p>
              <dl className="mt-4 divide-y divide-ink/15 font-mono text-sm">
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Inscription</dt>
                  <dd className="font-bold">Gratuite</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Adhésion</dt>
                  <dd className="font-bold">{formatFcfa(ADHESION_FEE)}</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Bonus parrainage</dt>
                  <dd className="font-bold">{formatFcfa(REFERRAL_BONUS)}</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Retrait minimum</dt>
                  <dd className="font-bold">{formatFcfa(MIN_WITHDRAWAL)}</dd>
                </div>
              </dl>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-60">
                Le détail des frais et conditions est affiché avant toute transaction.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== [02] Méthode ===== */}
      <section
        id="fonctionnement"
        className="border-b-3 border-ink bg-paper"
        aria-labelledby="steps-title"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 02 ] — Comment ça fonctionne</p>
            <p className="font-mono text-xs text-ink-60">3 étapes</p>
          </div>
          <h2
            id="steps-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black md:text-5xl"
          >
            Pas besoin de tout savoir avant de commencer.
          </h2>

          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.num} className="card p-6">
                <span className="font-mono text-5xl font-black text-flame">{s.num}</span>
                <h3 className="mt-4 font-serif text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-60">{s.desc}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Link href="/formations" className="btn btn-primary">
              Commencer avec le jour 1
            </Link>
          </div>
        </div>
      </section>

      {/* ===== [03] Parcours de transformation ===== */}
      <section className="border-b-3 border-ink bg-ink text-paper" aria-labelledby="journey-title">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t-3 border-acid pt-4">
            <p className="eyebrow !text-acid">[ 03 ] — Le parcours</p>
            <p className="font-mono text-xs text-paper/60">Progression visible</p>
          </div>
          <h2
            id="journey-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black text-paper md:text-5xl"
          >
            De l&apos;intention à une première réalisation.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="border-3 border-paper/25 p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-paper/60">
                Point de départ
              </p>
              <p className="mt-3 font-serif text-xl font-bold text-paper">
                « Je ne sais pas par où commencer. »
              </p>
            </div>
            <div className="border-3 border-paper/25 p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-paper/60">
                En avançant
              </p>
              <p className="mt-3 font-serif text-xl font-bold text-paper">
                « Je comprends, je teste, je réalise. »
              </p>
            </div>
            <div className="border-3 border-acid bg-acid p-6 text-ink">
              <p className="font-mono text-xs uppercase tracking-widest text-ink/70">
                Résultat visé
              </p>
              <p className="mt-3 font-serif text-xl font-bold">
                « J&apos;ai un profil, une offre ou une première mission. »
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/formations" className="btn bg-acid text-ink hover:bg-paper">
              Découvrir les formations
            </Link>
            <Link
              href="/dashboard/missions"
              className="btn border-3 border-paper bg-transparent text-paper hover:bg-paper hover:text-ink"
            >
              Consulter les missions disponibles
            </Link>
          </div>
        </div>
      </section>

      {/* ===== [04] Services ===== */}
      <section className="border-b-3 border-ink bg-paper" aria-labelledby="services-title">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 04 ] — Ce que tu peux faire ici</p>
            <p className="font-mono text-xs text-ink-60">06 rubriques</p>
          </div>
          <h2 id="services-title" className="mt-4 font-serif text-4xl font-black md:text-5xl">
            Un espace, six façons d&apos;avancer.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Link
                key={s.title}
                href={s.href}
                className={`card group p-6 transition-transform hover:-translate-y-1 ${i % 3 === 0 ? 'bg-acid' : 'bg-paper'}`}
              >
                <h3 className="font-serif text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-60">{s.desc}</p>
                <p className="mt-4 border-t border-ink/20 pt-3 font-mono text-xs font-bold uppercase tracking-wide">
                  {s.price}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== [05] Transparence ===== */}
      <section className="border-b-3 border-ink bg-paper-2" aria-labelledby="trust-title">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 05 ] — Transparence</p>
            <p className="font-mono text-xs text-ink-60">
              Ce qui est garanti, ce qui ne l&apos;est pas
            </p>
          </div>
          <h2
            id="trust-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black md:text-5xl"
          >
            Avant de rejoindre Izzibusiness, tu sais ce que tu obtiens.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {trustModules.map((t) => (
              <div key={t.title} className="card flex items-start gap-4 bg-paper p-6">
                <div>
                  <h3 className="font-serif text-xl font-bold">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-60">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof honnête : aucune donnée fictive tant que rien n'est vérifiable */}
          <div className="card mt-10 bg-paper p-6">
            <p className="eyebrow">[ Statut de la plateforme ]</p>
            <p className="mt-3 max-w-3xl font-serif text-lg leading-snug md:text-xl">
              Izzibusiness vient d&apos;ouvrir. Les premiers membres construisent actuellement leur
              parcours — les retours vérifiés, publiés avec l&apos;accord de leurs auteurs,
              apparaîtront ici.
            </p>
            <ul className="mt-4 grid list-[square] gap-2 pl-5 font-mono text-xs uppercase tracking-wide text-ink-60 sm:grid-cols-2">
              <li>Inscription gratuite, sans carte bancaire</li>
              <li>Montant affiché avant chaque confirmation</li>
              <li>Retrait mobile money dès {formatFcfa(MIN_WITHDRAWAL)}</li>
              <li>Historique de ton wallet consultable</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/formations" className="btn btn-ghost">
              Voir les tarifs
            </Link>
            <Link href="/dashboard/wallet" className="btn btn-ghost">
              Comprendre les paiements
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Poser une question
            </Link>
          </div>
        </div>
      </section>

      {/* ===== [06] CTA final ===== */}
      <section className="bg-ink" aria-labelledby="cta-title">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-24">
          <p className="eyebrow !text-acid">[ 06 ] — Rejoindre</p>
          <h2
            id="cta-title"
            className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-black text-paper md:text-6xl"
          >
            Commence gratuitement, décide ensuite.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-paper/70">
            Crée ton compte sans payer et explore la plateforme. L&apos;adhésion —{' '}
            {formatFcfa(ADHESION_FEE)}, paiement unique — ouvre l&apos;accès complet quand tu es
            prêt.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn bg-acid text-ink hover:bg-paper">
              Créer mon compte gratuit
            </Link>
            <Link
              href="/contact"
              className="btn border-3 border-paper bg-transparent text-paper hover:bg-paper hover:text-ink"
            >
              Parler à l&apos;équipe support
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-paper/60">
            Aucun paiement n&apos;est déclenché à la création du compte.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
