import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Jeux — Izzibusiness',
  description: 'Les jeux Izzibusiness sont en cours de refonte.',
};

const GAMES = [
  { name: 'Aviator', rule: 'Encaisser avant que la courbe ne s’arrête.' },
  { name: 'Spin & Win', rule: 'Une roue, un multiplicateur.' },
  { name: 'Apple Fortunes', rule: 'Révéler des cases sans tomber sur la mauvaise.' },
];

/**
 * Les anciens jeux tiraient le résultat dans le navigateur puis demandaient
 * au serveur de créditer le gain annoncé : n'importe qui pouvait se verser
 * le montant de son choix. Ils sont retirés jusqu'à leur refonte avec un
 * tirage côté serveur vérifiable.
 */
export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="container section">
        <p className="eyebrow">Jeux</p>
        <h1 className="mt-2 text-[clamp(2.25rem,1.4rem+3.6vw,4rem)]">En maintenance.</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-70">
          Les jeux sont en refonte complète : chaque résultat sera tiré par le serveur et enregistré
          dans ton historique avant d’être affiché. Aucune mise n’est possible pendant ce temps, ton
          solde n’est pas touché.
        </p>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {GAMES.map((game) => (
            <li key={game.name} className="card-flat">
              <h2 className="text-2xl">{game.name}</h2>
              <p className="mt-2 text-ink-70">{game.rule}</p>
              <p className="badge mt-4">Bientôt de retour</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
