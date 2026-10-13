'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppleFortunes from '@/components/games/AppleFortunes';
import SpinAndWin from '@/components/games/SpinAndWin';
import Aviator from '@/components/games/Aviator';
import Leaderboard from '@/components/games/Leaderboard';
import { useWallet } from '@/hooks/useWallet';

type GameId = 'aviator' | 'spin' | 'apple';

const games = [
  {
    id: 'aviator' as GameId,
    name: 'Aviator',
    description: 'Le jeu de crash le plus populaire. Encaissez avant le crash.',
    color: '#6366f1',
    popular: true,
  },
  {
    id: 'spin' as GameId,
    name: 'Spin & Win',
    description: 'Tournez la roue et tentez le Jackpot 25x.',
    color: '#b45309',
    popular: false,
  },
  {
    id: 'apple' as GameId,
    name: 'Apple Fortunes',
    description: 'Revelez les cases pour accumuler des multiplicateurs.',
    color: '#15803d',
    popular: false,
  },
];

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<GameId>('aviator');
  const { balance, gameBalance, loading, placeBet, collectWin } = useWallet();

  const currentGame = games.find((g) => g.id === selectedGame);
  const displayBalance = gameBalance > 0 ? gameBalance : balance;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          background: 'var(--bg-dark)',
          color: 'white',
          padding: '40px 0 32px',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '8px' }}>
            Jeux & Gains
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Des parties rapides avec des mises réelles — les gains ne sont jamais garantis.
          </p>

          {/* Balance */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Solde:</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)' }}>
              {loading ? '...' : displayBalance.toLocaleString()} FCFA
            </span>
            {gameBalance > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                (jeu: {gameBalance.toLocaleString()})
              </span>
            )}
            <a
              href="/dashboard/wallet"
              style={{
                padding: '6px 12px',
                background: 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Recharger
            </a>
          </div>
        </div>
      </section>

      {/* Game Selector */}
      <section style={{ padding: '20px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '24px',
            }}
          >
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedGame === game.id ? game.color : 'var(--border)'}`,
                  background: selectedGame === game.id ? `${game.color}10` : 'var(--bg-card)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {game.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {game.description}
                  </div>
                </div>
                {game.popular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      padding: '2px 8px',
                      background: 'var(--error)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '10px',
                    }}
                  >
                    POPULAIRE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Game Area */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  {currentGame?.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  {currentGame?.description}
                </p>
              </div>
            </div>

            {selectedGame === 'aviator' && (
              <Aviator balance={displayBalance} onBet={placeBet} onWin={collectWin} />
            )}
            {selectedGame === 'spin' && (
              <SpinAndWin balance={displayBalance} onBet={placeBet} onWin={collectWin} />
            )}
            {selectedGame === 'apple' && (
              <AppleFortunes balance={displayBalance} onBet={placeBet} onWin={collectWin} />
            )}
          </div>

          {/* Rules */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Regles du jeu
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {selectedGame === 'aviator' && (
                <>
                  <p>
                    <strong>Aviator:</strong> Un avion decole et le multiplicateur augmente.
                    Encaissez avant le crash pour gagner.
                  </p>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>Misez avant le decollage</li>
                    <li>Le multiplicateur monte de 1x jusqu&apos;au crash</li>
                    <li>Encaissez a tout moment pour securiser vos gains</li>
                    <li>Si l&apos;avion crash avant votre encaissement, vous perdez la mise</li>
                  </ul>
                </>
              )}
              {selectedGame === 'spin' && (
                <>
                  <p>
                    <strong>Spin & Win:</strong> Tournez la roue pour tenter de gagner.
                  </p>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>Cout par tour: 50 FCFA</li>
                    <li>6 segments gagnants sur 12 (50% de chances de gagner quelque chose)</li>
                    <li>Gains de 0.5x a 25x la mise ; 6 segments ne rapportent rien</li>
                    <li>Le Jackpot 25x est le gain maximum</li>
                  </ul>
                </>
              )}
              {selectedGame === 'apple' && (
                <>
                  <p>
                    <strong>Apple Fortunes:</strong> Revelez les cases pour accumuler des
                    multiplicateurs.
                  </p>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>Misez et cliquez sur les cases</li>
                    <li>Chaque case revelee augmente le multiplicateur</li>
                    <li>Une case peut crasher (15% de chance)</li>
                    <li>Encaissez a tout moment ou continuez pour plus</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#fef3c7',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: '#92400e',
            }}
          >
            <strong>Avertissement :</strong> ces jeux sont pour le divertissement, avec des mises
            réelles (dès 50 FCFA). Les gains dépendent du hasard et ne sont jamais garantis. Le
            solde de jeux est distinct du solde principal. Ne misez que des montants dont vous
            n&apos;avez pas besoin.
          </div>

          {/* Leaderboard */}
          <div style={{ marginTop: '24px' }}>
            <Leaderboard title="Meilleurs Joueurs" showFilters={true} limit={5} />
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <a
                href="/leaderboard"
                style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}
              >
                Voir le classement complet
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
