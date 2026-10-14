import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  formatFcfa,
  ADHESION_FEE,
  GAME_RTP,
  MAX_BET,
  MIN_BET,
  MIN_WITHDRAWAL,
  WITHDRAWAL_FEE_RATE,
  MIN_DEPOSIT,
} from '@/lib/config';

// Contenu légal : décrit uniquement ce que le produit fait réellement.
// Les montants viennent de config.ts (source de vérité unique) — aucun chiffre
// codé en dur. Aucune mention d'organisme fictif, aucune promesse de gains.

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Izzibusiness",
  description:
    "Les règles qui s'appliquent quand tu utilises Izzibusiness : compte, adhésion, wallet, jeux, marketplace et responsabilités de chacun.",
};

const sections = [
  {
    id: 'compte',
    title: '1. Ton compte',
    items: [
      "L'inscription est gratuite. Elle demande un pseudo, une adresse e-mail, ton pays, un numéro de téléphone Mobile Money valide et un mot de passe.",
      'Tu es responsable de la confidentialité de ton accès. Les actions réalisées depuis ton compte sont réputées être les tiennes.',
      'Un seul compte par personne. Les comptes créés pour manipuler les récompenses, le parrainage ou le classement peuvent être suspendus.',
    ],
  },
  {
    id: 'adhesion',
    title: '2. Adhésion et paiements',
    items: [
      `L'adhésion coûte ${formatFcfa(ADHESION_FEE)}, paiement unique, affiché avant toute confirmation. Elle ouvre l'accès complet aux formations, missions, jeux et retraits.`,
      `Les dépôts se font par Mobile Money via notre prestataire de paiement PayDunya, à partir de ${formatFcfa(MIN_DEPOSIT)}. Le wallet est crédité dès que l'opérateur confirme le paiement.`,
      `Le retrait minimum est de ${formatFcfa(MIN_WITHDRAWAL)}. Des frais de ${Math.round(WITHDRAWAL_FEE_RATE * 100)} % s'appliquent et sont affichés avant confirmation.`,
      "Un retrait est envoyé uniquement vers le numéro enregistré sur ton compte. Le montant et les frais sont bloqués dès la demande, puis l'équipe vérifie et déclenche l'envoi. En cas de refus ou d'échec, la totalité est restituée sur ton wallet.",
    ],
  },
  {
    id: 'jeux',
    title: '3. Jeux',
    items: [
      'Les jeux sont réservés aux adhérents majeurs (18 ans ou plus) qui ont accepté leurs règles. Les mises sont débitées du wallet et les gains y sont crédités.',
      `Les mises vont de ${formatFcfa(MIN_BET)} à ${formatFcfa(MAX_BET)} par partie. Chaque résultat est tiré par le serveur ; sur la durée, environ ${Math.round(GAME_RTP * 100)} % des mises sont redistribuées aux joueurs.`,
      "Les gains ne sont jamais garantis. Joue de manière responsable et ne mise que des montants dont tu n'as pas besoin. L'administration peut fermer un jeu à tout moment ; les parties en cours restent honorées.",
    ],
  },
  {
    id: 'marketplace',
    title: '4. Marketplace',
    items: [
      "La marketplace met en relation des membres. Ses conditions de vente, y compris d'éventuels frais, seront publiées ici avant son ouverture.",
      'Les vendeurs sont responsables de la description, du prix et de la livraison de leurs offres. Les acheteurs vérifient avant de payer.',
      'Les offres illégales, trompeuses ou portant atteinte à autrui sont retirées et le compte concerné peut être suspendu.',
    ],
  },
  {
    id: 'responsabilites',
    title: '5. Ce que nous ne garantissons pas',
    items: [
      "Aucun revenu n'est garanti. Les résultats dépendent de ton activité, de tes compétences et des opportunités disponibles.",
      "Le service est fourni « en l'état ». Nous travaillons à sa fiabilité, mais des interruptions techniques sont possibles.",
      "Nous pouvons faire évoluer les règles du service. Les changements touchant les paiements sont annoncés à l'avance dans ton espace.",
    ],
  },
  {
    id: 'contenu',
    title: '6. Contenu et conduite',
    items: [
      "Reste courtois avec les autres membres. Harcèlement, spam et usurpation d'identité entraînent la suspension.",
      "Le contenu des formations est destiné à ton usage personnel. Le redistribuer ou le revendre n'est pas autorisé.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar />
      <section className="section">
        <div className="mx-auto max-w-3xl px-5">
          <p className="eyebrow">[ Légal ]</p>
          <h1 className="mt-3 font-serif text-4xl font-black md:text-5xl">
            Conditions d&apos;utilisation
          </h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-wide text-ink-60">
            En vigueur depuis le 24 septembre 2026 · Version courte et lisible
          </p>
          <p className="mt-6 leading-relaxed text-ink-70">
            Ces conditions décrivent les règles qui s&apos;appliquent quand tu crées un compte et
            utilises Izzibusiness. Elles sont volontairement courtes : chaque règle listée ici est
            réellement appliquée.
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
            <p className="eyebrow">[ Une question ? ]</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-70">
              Si un point t&apos; semble ambigu, demande avant de t&apos;engager. Le support répond
              aux questions sur les règles, les frais et les retraits.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Poser une question
              </Link>
              <Link href="/privacy" className="btn btn-ghost">
                Voir la politique de confidentialité
              </Link>
            </div>
          </div>

          <p className="mt-6 font-mono text-xs text-ink-60">
            Rappel : adhésion {formatFcfa(ADHESION_FEE)} unique · dépôt dès{' '}
            {formatFcfa(MIN_DEPOSIT)} · retrait dès {formatFcfa(MIN_WITHDRAWAL)}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
