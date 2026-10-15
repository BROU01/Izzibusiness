import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmptyState from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Marché — Izzibusiness',
  description: 'Les boutiques et produits des membres Izzibusiness.',
};

/**
 * Le marché affichait six produits écrits en dur et des filtres sans effet.
 * Il sera alimenté par les tables boutiques / produits (lot marketplace).
 */
export default function MarketPage() {
  return (
    <>
      <Navbar />
      <main className="container section">
        <p className="eyebrow">Marché</p>
        <h1 className="mt-2 text-[clamp(2.25rem,1.4rem+3.6vw,4rem)]">Les boutiques des membres.</h1>
        <p className="mt-4 mb-10 max-w-2xl text-lg text-ink-70">
          Chaque membre pourra ouvrir sa boutique, publier ses produits et être payé par Mobile
          Money.
        </p>
        <EmptyState
          title="Les premières boutiques ouvrent bientôt"
          description="Crée ton compte dès maintenant : tu pourras ouvrir ta boutique dès l’ouverture du marché."
          action={{ href: '/register', label: 'Créer mon compte' }}
        />
      </main>
      <Footer />
    </>
  );
}
