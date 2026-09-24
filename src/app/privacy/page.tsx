import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Politique de confidentialité : décrit uniquement ce que la plateforme
// collecte réellement aujourd'hui (nom, téléphone, wallet, transactions,
// notifications, progression locale). Aucune mention de pratique inexistante
// (cookies tiers, analytics, newsletters) — la transparence vaut mieux
// qu'un texte copié-collé qui promettrait ce qui n'est pas mis en œuvre.

export const metadata: Metadata = {
  title: 'Confidentialité — Izzibusiness',
  description:
    'Quelles données Izzibusiness collecte, pourquoi, et comment les demander : nom, téléphone, wallet, transactions et progression.',
};

const sections = [
  {
    id: 'donnees',
    title: '1. Ce que nous collectons',
    items: [
      'Ton nom et ton numéro de téléphone, pour créer ton compte et vérifier ton numéro par code SMS.',
      "L'activité de ton wallet : dépôts, retraits, mises de jeu, gains, récompenses de missions et bonus de parrainage.",
      'Tes notifications (bienvenue, transactions, parrainage) et ta progression dans le programme, pour afficher ton espace.',
      "Si tu le partages : un code de parrainage, qui relie ton inscription à la personne qui t'a invité.",
    ],
  },
  {
    id: 'usage',
    title: '2. Pourquoi',
    items: [
      'Faire fonctionner le service : compte, wallet, paiements mobile money, historique consultable.',
      'Sécuriser les transactions et traiter les incidents (retrait non reçu, paiement non confirmé).',
      'Te joindre si nécessaire au sujet de ton compte — jamais pour de la publicité non demandée.',
    ],
  },
  {
    id: 'partage',
    title: '3. Ce que nous ne faisons pas',
    items: [
      'Nous ne vendons pas tes données. Elles ne sont ni revendues, ni louées, ni échangées.',
      "Nous n'affichons pas ton numéro de téléphone aux autres membres : la marketplace et le classement montrent ton nom et ton pseudo, pas tes coordonnées.",
      "Nous n'utilisons pas de traceurs publicitaires tiers sur le site.",
    ],
  },
  {
    id: 'duree',
    title: '4. Conservation',
    items: [
      'Les données de ton compte (profil, wallet, transactions) sont conservées tant que ton compte existe, car elles constituent ton historique consultable.',
      'Les codes de vérification SMS sont temporaires et expirent rapidement.',
      'Si tu supprimes ton compte, tes données personnelles sont supprimées ; les enregistrements financiers nécessaires peuvent être conservés selon la loi.',
    ],
  },
  {
    id: 'droits',
    title: '5. Tes droits',
    items: [
      'Tu peux demander à voir, corriger ou supprimer tes données en écrivant au support depuis la page contact.',
      'Tu peux exporter ton historique de transactions à tout moment : il est affiché dans ton wallet et peut être demandé en format lisible.',
      'Une demande reçoit une réponse dans un délai raisonnable, généralement sous quelques jours.',
    ],
  },
  {
    id: 'securite',
    title: '6. Sécurité',
    items: [
      "Ton numéro est vérifié par code SMS à l'inscription.",
      "Les accès administrateurs aux données sont limités aux besoins de l'assistance et de la comptabilité.",
      "Aucun moyen de paiement n'est stocké sur la plateforme : les paiements passent par ton opérateur mobile money.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar />
      <section className="section">
        <div className="mx-auto max-w-3xl px-5">
          <p className="eyebrow">[ Légal ]</p>
          <h1 className="mt-3 font-serif text-4xl font-black md:text-5xl">
            Politique de confidentialité
          </h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-wide text-ink-60">
            En vigueur depuis le 24 septembre 2026 · Version courte et lisible
          </p>
          <p className="mt-6 leading-relaxed text-ink-70">
            Cette page explique simplement quelles données Izzibusiness collecte, pourquoi, et ce
            que nous n&apos;en faisons pas. Le principe : ne collecter que ce qui fait fonctionner
            ton compte.
          </p>

          <div className="rule my-8" />

          {sections.map((s) => (
            <section key={s.id} aria-labelledby={s.id} className="mt-8 first:mt-0">
              <h2 id={s.id} className="font-serif text-2xl font-bold">
                {s.title}
              </h2>
              <ul className="mt-3 grid gap-2">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-ink-70">
                    <span aria-hidden="true" className="mt-1 font-mono font-bold text-flame">
                      —
                    </span>
                    <span className="text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="card mt-12 bg-paper-2 p-6">
            <p className="eyebrow">[ Exercer tes droits ]</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-70">
              Pour voir, corriger ou supprimer tes données, une seule voie : le support. Précise ton
              numéro de téléphone pour que la demande soit traitée rapidement.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Contacter le support
              </Link>
              <Link href="/terms" className="btn btn-ghost">
                Voir les conditions d&apos;utilisation
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
