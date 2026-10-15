import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ADHESION_FEE,
  GAME_RTP,
  MIN_BET,
  MIN_DEPOSIT,
  MIN_WITHDRAWAL,
  REFERRAL_BONUS,
  WITHDRAWAL_FEE_RATE,
  formatFcfa,
} from '@/lib/config';
import { createClient } from '@/lib/supabase/server';
import {
  FaqAccordion,
  HeroItem,
  HeroStagger,
  Highlight,
  LandingMotion,
  Reveal,
  ServicesGrid,
  StampCard,
  StepsTimeline,
} from '@/components/landing/motion';

// Page publique : tout visiteur peut lire. Les fonctionnalités (marché,
// formations, missions, jeux, parrainage) sont réservées aux comptes
// connectés et protégées par src/proxy.ts.
// Aucune donnée inventée : les montants viennent de src/lib/config.ts.

const feePercent = `${(WITHDRAWAL_FEE_RATE * 100).toLocaleString('fr-FR')} %`;

const SERVICES = [
  {
    title: 'Formations',
    desc: 'Des parcours courts et pratiques, dont un programme guidé de 20 jours et un module sur l’intelligence artificielle appliquée.',
    href: '/formations',
    note: 'Inclus avec l’adhésion',
  },
  {
    title: 'Missions rémunérées',
    desc: 'Des tâches publiées par l’équipe, avec la rémunération annoncée à l’avance. Tu envoies ta preuve, l’équipe vérifie, ton wallet est crédité.',
    href: '/dashboard/missions',
    note: 'Pour les adhérents',
  },
  {
    title: 'Jeux',
    desc: `Aviator, Spin & Win et Apple Fortunes, avec ton solde. Résultats tirés par le serveur, environ ${Math.round(GAME_RTP * 100)} % des mises redistribués sur la durée. Réservé aux majeurs.`,
    href: '/games',
    note: `Mises dès ${formatFcfa(MIN_BET)}`,
  },
  {
    title: 'Marché',
    desc: 'Les boutiques des membres : chacun pourra publier ses produits et être payé par Mobile Money.',
    href: '/market',
    note: 'Ouverture prochaine',
  },
  {
    title: 'Parrainage',
    desc: 'Partage ton lien d’invitation. Quand une personne invitée règle son adhésion, tu reçois un bonus sur ton wallet.',
    href: '/dashboard/referrals',
    note: `${formatFcfa(REFERRAL_BONUS)} par filleul adhérent`,
  },
  {
    title: 'Wallet Mobile Money',
    desc: 'Dépôts et retraits via MTN, Moov, Orange, Wave et d’autres opérateurs selon ton pays, par l’intermédiaire de PayDunya.',
    href: '/dashboard/wallet',
    note: `Retrait dès ${formatFcfa(MIN_WITHDRAWAL)}`,
  },
];

const STEPS = [
  {
    title: 'Crée ton compte',
    desc: 'Pseudo, e-mail, pays, téléphone et mot de passe. C’est gratuit et sans engagement.',
  },
  {
    title: 'Active ton adhésion',
    desc: `${formatFcfa(ADHESION_FEE)}, une seule fois, par Mobile Money ou avec ton solde. Elle débloque les missions, les jeux et les retraits.`,
  },
  {
    title: 'Utilise la plateforme',
    desc: 'Suis les formations, réalise des missions, joue avec ton solde, invite tes proches.',
  },
  {
    title: 'Retire tes gains',
    desc: `Vers ton numéro Mobile Money, à partir de ${formatFcfa(MIN_WITHDRAWAL)}, frais de ${feePercent}. Chaque retrait est vérifié par l’équipe avant l’envoi.`,
  },
];

const FAQ = [
  {
    q: 'L’inscription est-elle payante ?',
    a: `Non. Créer un compte est gratuit. Seule l’adhésion (${formatFcfa(ADHESION_FEE)}, une seule fois) est payante ; elle est nécessaire pour les missions, les jeux et les retraits.`,
  },
  {
    q: 'Comment déposer de l’argent sur mon wallet ?',
    a: `Depuis ton wallet, choisis un montant (minimum ${formatFcfa(MIN_DEPOSIT)}). Tu es redirigé vers la page de paiement sécurisée PayDunya, puis ton solde est crédité dès que l’opérateur confirme le paiement.`,
  },
  {
    q: 'Comment retirer, et combien de temps cela prend-il ?',
    a: `Le retrait part vers le numéro Mobile Money de ton compte, à partir de ${formatFcfa(MIN_WITHDRAWAL)}, avec ${feePercent} de frais. Le montant est bloqué dès la demande, puis envoyé après vérification par l’équipe. En cas de refus, tout est restitué sur ton wallet.`,
  },
  {
    q: 'Les jeux sont-ils équitables ?',
    a: `Chaque résultat est tiré par le serveur avant d’être affiché, à partir d’une graine secrète dont l’empreinte est enregistrée au début de la partie et révélée à la fin. Sur la durée, environ ${Math.round(GAME_RTP * 100)} % des mises sont redistribuées : la plateforme garde le reste. Aucun gain n’est garanti, et les jeux sont réservés aux personnes majeures.`,
  },
  {
    q: 'Comment fonctionnent les missions ?',
    a: 'Chaque mission indique ce qu’il faut faire, la preuve à fournir et la rémunération exacte. Une fois ta preuve validée par l’équipe, la récompense arrive sur ton wallet.',
  },
  {
    q: 'Comment fonctionne le parrainage ?',
    a: `Ton lien d’invitation est dans ton espace. Tu reçois ${formatFcfa(REFERRAL_BONUS)} quand une personne inscrite avec ton lien règle son adhésion.`,
  },
  {
    q: 'Dans quels pays puis-je utiliser Izzibusiness ?',
    a: 'L’inscription est ouverte au Bénin, au Togo, en Côte d’Ivoire, au Sénégal, au Burkina Faso, au Mali, au Niger, au Cameroun, au Gabon et dans les deux Congo. Les dépôts et retraits dépendent des opérateurs Mobile Money pris en charge par PayDunya dans ton pays.',
  },
  {
    q: 'Que faites-vous de mes données ?',
    a: 'Ton téléphone et ton e-mail servent à ton compte et à tes paiements ; ils ne sont jamais affichés aux autres membres. Les détails sont dans la politique de confidentialité.',
  },
];

async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function HomePage() {
  const signedIn = await isSignedIn();
  const primary = signedIn
    ? { href: '/dashboard', label: 'Ouvrir mon espace' }
    : { href: '/register', label: 'Créer mon compte gratuit' };

  const services = SERVICES.map((s) => ({
    title: s.title,
    desc: s.desc,
    note: s.note,
    href: signedIn ? s.href : `/login?redirect=${encodeURIComponent(s.href)}`,
    cta: signedIn ? `Ouvrir : ${s.title}` : 'Se connecter pour accéder',
  }));

  return (
    <LandingMotion>
      <Navbar />
      <main className="bg-paper text-ink">
        {/* Hero */}
        <section className="border-b-3 border-ink" aria-labelledby="hero-title">
          <div className="container grid items-end gap-10 py-14 md:grid-cols-[1.5fr_1fr] md:py-20 [&>*]:min-w-0">
            <HeroStagger>
              <HeroItem>
                <p className="eyebrow">Apprendre · Agir · Encaisser</p>
              </HeroItem>
              <HeroItem>
                <h1
                  id="hero-title"
                  className="mt-4 text-[2.4rem] leading-[1.02] sm:text-5xl md:text-7xl"
                >
                  Formations, missions, jeux et <Highlight>wallet Mobile Money</Highlight>, au même
                  endroit.
                </h1>
              </HeroItem>
              <HeroItem>
                <p className="mt-6 max-w-xl text-lg text-ink-70">
                  Lis tout ce qu’il faut savoir ici. Les services s’ouvrent dès que tu as un compte.
                </p>
              </HeroItem>
              <HeroItem className="mt-8 flex flex-wrap gap-4">
                <Link href={primary.href} className="btn btn-primary">
                  {primary.label}
                </Link>
                <Link href="#comment-ca-marche" className="btn btn-ghost">
                  Voir comment ça marche
                </Link>
              </HeroItem>
            </HeroStagger>

            <StampCard className="card" label="Les montants à connaître">
              <p className="eyebrow">Avant de t’engager</p>
              <dl className="mt-4 divide-y-2 divide-ink/15 font-mono text-sm">
                <div className="flex justify-between gap-4 py-2">
                  <dt>Inscription</dt>
                  <dd className="font-bold">Gratuite</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>Adhésion (une fois)</dt>
                  <dd className="font-bold">{formatFcfa(ADHESION_FEE)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>Bonus parrainage</dt>
                  <dd className="font-bold">{formatFcfa(REFERRAL_BONUS)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>Retrait minimum</dt>
                  <dd className="font-bold">{formatFcfa(MIN_WITHDRAWAL)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>Frais de retrait</dt>
                  <dd className="font-bold">{feePercent}</dd>
                </div>
              </dl>
            </StampCard>
          </div>
        </section>

        {/* Services */}
        <section
          id="services"
          className="scroll-mt-20 border-b-3 border-ink"
          aria-labelledby="services-title"
        >
          <div className="container section">
            <Reveal>
              <p className="eyebrow">[ 01 ] Services</p>
              <h2 id="services-title" className="mt-3 text-4xl md:text-5xl">
                Ce que tu trouves ici.
              </h2>
              <p className="mt-3 max-w-2xl text-ink-70">
                Chaque service s’ouvre après connexion
                {signedIn ? ' : tu es connecté, choisis où aller.' : '.'}
              </p>
            </Reveal>
            <ServicesGrid items={services} />
          </div>
        </section>

        {/* Comment ça marche */}
        <section
          id="comment-ca-marche"
          className="scroll-mt-20 border-b-3 border-ink bg-ink text-paper"
          aria-labelledby="how-title"
        >
          <div className="container section">
            <Reveal>
              <p className="eyebrow !text-acid">[ 02 ] Comment ça marche</p>
              <h2 id="how-title" className="mt-3 text-4xl md:text-5xl">
                Quatre étapes, dans l’ordre.
              </h2>
            </Reveal>
            <StepsTimeline steps={STEPS} />
            {!signedIn && (
              <Link href="/register" className="btn btn-primary mt-10">
                Commencer par l’étape 1
              </Link>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-20 border-b-3 border-ink"
          aria-labelledby="faq-title"
        >
          <div className="container section grid gap-10 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <p className="eyebrow">[ 03 ] FAQ</p>
              <h2 id="faq-title" className="mt-3 text-4xl md:text-5xl">
                Questions fréquentes.
              </h2>
              <p className="mt-3 text-ink-70">
                Une autre question ?{' '}
                <Link href="/contact" className="font-bold underline underline-offset-4">
                  Écris à l’équipe
                </Link>
                .
              </p>
            </Reveal>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* Appel final */}
        {!signedIn && (
          <section className="bg-acid" aria-labelledby="cta-title">
            <Reveal className="container section text-center">
              <h2 id="cta-title" className="text-4xl md:text-5xl">
                Ton compte est gratuit.
              </h2>
              <p className="mx-auto mt-3 max-w-xl">
                Crée-le maintenant, découvre ton espace, et décide ensuite si tu actives l’adhésion.
              </p>
              <Link href="/register" className="btn btn-dark mt-8">
                Créer mon compte gratuit
              </Link>
            </Reveal>
          </section>
        )}
      </main>
      <Footer />
    </LandingMotion>
  );
}
