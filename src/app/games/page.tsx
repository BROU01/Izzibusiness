import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GamesClient from './GamesClient';

export const metadata: Metadata = {
  title: 'Jeux — Izzibusiness',
  description: 'Aviator, Spin & Win et Apple Fortunes, avec résultats tirés côté serveur.',
};

// Accès réservé aux comptes connectés (src/proxy.ts) ; adhésion vérifiée par l'API.
export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="container section">
        <p className="eyebrow">Jeux</p>
        <h1 className="mt-2 mb-8 text-[clamp(2.25rem,1.4rem+3.6vw,4rem)]">Joue avec ton solde.</h1>
        <GamesClient />
      </main>
      <Footer />
    </>
  );
}
