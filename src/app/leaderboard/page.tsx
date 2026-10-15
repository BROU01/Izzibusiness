import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmptyState from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Classement — Izzibusiness',
  description: 'Le classement des membres Izzibusiness.',
};

/**
 * L'ancien classement affichait des joueurs et des gains inventés. Il
 * reviendra quand les parties seront tirées et enregistrées côté serveur.
 */
export default function LeaderboardPage() {
  return (
    <>
      <Navbar />
      <main className="container section">
        <p className="eyebrow">Classement</p>
        <h1 className="mt-2 mb-8 text-[clamp(2.25rem,1.4rem+3.6vw,4rem)]">
          Les meilleurs membres du mois.
        </h1>
        <EmptyState
          title="Classement indisponible pour l’instant"
          description="Il sera calculé à partir des vraies parties et des ventes enregistrées sur la plateforme. Aucun chiffre n’est affiché tant qu’il n’est pas réel."
          action={{ href: '/market', label: 'Parcourir le marché' }}
        />
      </main>
      <Footer />
    </>
  );
}
