import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatFcfa, ADHESION_FEE } from '@/lib/config';
import { CURRICULUM_DAYS, CURRICULUM_TOTAL } from '@/lib/curriculum';

// Page « Formation IA » — liée depuis la carte services de l'accueil.
// Framework Trust & Conversion (mêmes règles que l'accueil) : 1 promesse →
// 1 preuve → 1 action. Aucune donnée fictive : le nombre de jours, le rythme
// et l'exemple de prompt viennent de src/lib/curriculum.ts ; les montants
// viennent de src/lib/config.ts (source de vérité unique).
// Interdits ici : promesses de gains, témoignages inventés, compteurs d'usage.

export const metadata: Metadata = {
  title: 'Formation IA — Izzibusiness',
  description:
    "Un module complet sur l'intelligence artificielle appliquée à tes projets : parcours guidé, modèles de prompts réutilisables et un critère de validation par jour. Incluse dans l'adhésion.",
};

// Rythme calculé depuis les données réelles du programme (mock assumé,
// voir curriculum.ts) plutôt que codé en dur.
const DURATIONS = CURRICULUM_DAYS.map((d) => d.activity.durationMin);
const MIN_MINUTES = Math.min(...DURATIONS);
const MAX_MINUTES = Math.max(...DURATIONS);

// Exemple réel tiré du Jour 1 — aucun prompt inventé pour la page.
const SAMPLE_PROMPT = CURRICULUM_DAYS[0].promptExample;

const skills = [
  {
    num: '01',
    title: 'Clarifier ton objectif',
    desc: "Passer d'une intention vague à un objectif en 3 phrases, avec un point de départ concret.",
  },
  {
    num: '02',
    title: 'Repérer des besoins réels',
    desc: 'Observer ton environnement et identifier des problèmes que des gens paient déjà à résoudre.',
  },
  {
    num: '03',
    title: 'Formuler une offre claire',
    desc: 'Public, problème, résultat, prix, preuve : une offre qui se comprend sans explication.',
  },
  {
    num: '04',
    title: 'Écrire des prompts qui servent',
    desc: "Des modèles réutilisables pour clarifier, analyser, rédiger et vérifier ton travail avec l'IA.",
  },
  {
    num: '05',
    title: 'Fixer un prix qui tient',
    desc: 'Prix plancher, prix cible : deux seuils calculés à partir de ta situation réelle.',
  },
  {
    num: '06',
    title: "Passer à l'action",
    desc: 'Premiers contacts, premières propositions, premiers livrables — avec un critère de validation à chaque étape.',
  },
];

const formatSteps = [
  {
    num: '01',
    title: 'Une activité courte',
    desc: `Vidéo, lecture ou outil à manipuler — entre ${MIN_MINUTES} et ${MAX_MINUTES} minutes.`,
  },
  {
    num: '02',
    title: 'Un exercice concret',
    desc: 'Tu appliques sur ton propre projet, avec un modèle de prompt à adapter à ta situation.',
  },
  {
    num: '03',
    title: 'Un critère de validation',
    desc: 'Une preuve observable que le jour est fait — jamais un « réussir » vague.',
  },
];

const trustModules = [
  {
    title: "Incluse dans l'adhésion",
    desc: `Le module est accessible avec l'adhésion unique — ${formatFcfa(ADHESION_FEE)} —, affichée avant toute confirmation. Aucun frais caché.`,
  },
  {
    title: 'Aucun gain garanti',
    desc: 'Le module enseigne des méthodes, pas des résultats. Ce que tu obtiens dépend de ton activité et des opportunités disponibles.',
  },
  {
    title: 'Contenu vérifiable',
    desc: `${CURRICULUM_TOTAL} jours, des modèles de prompts, un exercice et un critère de validation par jour. Rien d'autre n'est promis.`,
  },
];

export default function FormationIaPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="border-b-3 border-ink" aria-labelledby="hero-title">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/30 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-60">
            <span>Formation IA · Module appliqué</span>
            <span>Édition {new Date().getFullYear()}</span>
          </div>

          <div className="grid items-end gap-10 py-14 md:grid-cols-[1.5fr_1fr] md:py-20">
            <div>
              <p className="eyebrow">[ 01 ] — L&apos;IA appliquée à tes projets</p>
              <h1
                id="hero-title"
                className="mt-5 font-serif text-5xl font-black leading-[1.02] tracking-tight md:text-7xl"
              >
                Fais de l&apos;IA une compétence{' '}
                <span className="bg-acid px-1 box-decoration-clone">qui travaille pour toi</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-60">
                Un parcours guidé de {CURRICULUM_TOTAL} jours : des modèles de prompts
                réutilisables, des exercices sur ton propre projet et un critère de validation clair
                à chaque étape.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/formations" className="btn btn-primary">
                  Commencer l&apos;adhésion — {formatFcfa(ADHESION_FEE)}
                </Link>
                <Link href="#programme" className="btn btn-ghost">
                  Voir le format jour par jour
                </Link>
              </div>
              <p className="mt-4 font-mono text-xs text-ink-60">
                Inscription gratuite · Aucun paiement n&apos;est déclenché à cette étape
              </p>
            </div>

            {/* Encadré factuel : chiffres issus de curriculum.ts et config.ts */}
            <aside className="card bg-paper p-6" aria-label="Caractéristiques du module">
              <p className="eyebrow">En bref</p>
              <dl className="mt-4 divide-y divide-ink/15 font-mono text-sm">
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Format</dt>
                  <dd className="font-bold">Parcours guidé</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Durée</dt>
                  <dd className="font-bold">{CURRICULUM_TOTAL} jours</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Rythme</dt>
                  <dd className="font-bold">
                    ~{MIN_MINUTES}–{MAX_MINUTES} min / jour
                  </dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Accès</dt>
                  <dd className="font-bold">Inclus dans l&apos;adhésion</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-ink-60">Adhésion</dt>
                  <dd className="font-bold">{formatFcfa(ADHESION_FEE)}</dd>
                </div>
              </dl>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-60">
                Paiement unique. Le détail est affiché avant toute confirmation.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== [02] Ce que tu apprends ===== */}
      <section className="border-b-3 border-ink bg-paper" aria-labelledby="skills-title">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 02 ] — Ce que tu apprends</p>
            <p className="font-mono text-xs text-ink-60">06 compétences</p>
          </div>
          <h2
            id="skills-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black md:text-5xl"
          >
            De l&apos;usage occasionnel à la méthode.
          </h2>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((s, i) => (
              <li key={s.num} className={`card p-6 ${i === 3 ? 'bg-acid' : 'bg-paper'}`}>
                <span className="font-mono text-4xl font-black text-flame">{s.num}</span>
                <h3 className="mt-4 font-serif text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-60">{s.desc}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Link href="/formations" className="btn btn-primary">
              Voir le catalogue complet
            </Link>
          </div>
        </div>
      </section>

      {/* ===== [03] Le format jour par jour ===== */}
      <section
        id="programme"
        className="border-b-3 border-ink bg-paper-2"
        aria-labelledby="format-title"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 03 ] — Le format</p>
            <p className="font-mono text-xs text-ink-60">
              {CURRICULUM_TOTAL} jours · dans l&apos;ordre
            </p>
          </div>
          <h2
            id="format-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black md:text-5xl"
          >
            Un jour à la fois, avec une preuve à la fin.
          </h2>

          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {formatSteps.map((s) => (
              <li key={s.num} className="card bg-paper p-6">
                <span className="font-mono text-5xl font-black text-flame">{s.num}</span>
                <h3 className="mt-4 font-serif text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-60">{s.desc}</p>
              </li>
            ))}
          </ol>

          {/* Exemple réel de modèle de prompt (Jour 1) */}
          <div className="card mt-10 bg-paper p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">[ Exemple — Jour 01 ]</p>
              <span className="badge">{SAMPLE_PROMPT.site}</span>
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold">
              Modèle de prompt : {SAMPLE_PROMPT.label}
            </h3>
            <p className="mt-4 border-3 border-ink bg-ink p-4 font-mono text-sm leading-relaxed text-paper">
              {SAMPLE_PROMPT.prompt}
            </p>
            <p className="mt-3 font-mono text-xs text-ink-60">
              Chaque jour du programme fournit son propre modèle, à adapter en remplaçant les
              crochets [ ].
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-primary">
              Créer mon compte gratuit
            </Link>
            <Link href="/dashboard/onboarding/calendar" className="btn btn-ghost">
              Ouvrir le programme dans mon espace
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-ink-60">
            Le programme s&apos;ouvre dans ton espace membre, avec ta progression enregistrée.
          </p>
        </div>
      </section>

      {/* ===== [04] Transparence ===== */}
      <section className="border-b-3 border-ink bg-paper" aria-labelledby="trust-title">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rule" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">[ 04 ] — Transparence</p>
            <p className="font-mono text-xs text-ink-60">
              Ce qui est garanti, ce qui ne l&apos;est pas
            </p>
          </div>
          <h2
            id="trust-title"
            className="mt-4 max-w-2xl font-serif text-4xl font-black md:text-5xl"
          >
            Avant de t&apos;engager, tu sais ce que tu obtiens.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {trustModules.map((t) => (
              <div key={t.title} className="card flex items-start gap-4 bg-paper-2 p-6">
                <div>
                  <h3 className="font-serif text-xl font-bold">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-60">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/formations" className="btn btn-ghost">
              Voir les tarifs
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Poser une question
            </Link>
          </div>
        </div>
      </section>

      {/* ===== [05] CTA final ===== */}
      <section className="bg-ink" aria-labelledby="cta-title">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-24">
          <p className="eyebrow !text-acid">[ 05 ] — Commencer</p>
          <h2
            id="cta-title"
            className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-black text-paper md:text-6xl"
          >
            Commence par le Jour 1.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-paper/70">
            Crée ton compte gratuitement et ouvre le premier exercice dès aujourd&apos;hui.
            L&apos;adhésion — {formatFcfa(ADHESION_FEE)}, paiement unique — ouvre l&apos;accès
            complet quand tu es prêt.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn bg-acid text-ink hover:bg-paper">
              Créer mon compte gratuit
            </Link>
            <Link
              href="/formations"
              className="btn border-3 border-paper bg-transparent text-paper hover:bg-paper hover:text-ink"
            >
              Revoir le catalogue
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
