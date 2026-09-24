'use client';

import Link from 'next/link';

const gameHistory = [
  {
    id: 1,
    game: 'Aviator',
    result: 'win',
    bet: 500,
    multiplier: '2.5x',
    win: 1250,
    date: '30 Aout 2026',
  },
  {
    id: 2,
    game: 'Spin & Win',
    result: 'loss',
    bet: 50,
    multiplier: '0x',
    win: 0,
    date: '30 Aout 2026',
  },
  {
    id: 3,
    game: 'Apple Fortunes',
    result: 'win',
    bet: 200,
    multiplier: '3.0x',
    win: 600,
    date: '29 Aout 2026',
  },
  {
    id: 4,
    game: 'Aviator',
    result: 'loss',
    bet: 1000,
    multiplier: '1.2x',
    win: 0,
    date: '29 Aout 2026',
  },
  {
    id: 5,
    game: 'Spin & Win',
    result: 'win',
    bet: 50,
    multiplier: '10x',
    win: 500,
    date: '28 Aout 2026',
  },
  {
    id: 6,
    game: 'Aviator',
    result: 'win',
    bet: 250,
    multiplier: '4.5x',
    win: 1125,
    date: '28 Aout 2026',
  },
  {
    id: 7,
    game: 'Apple Fortunes',
    result: 'loss',
    bet: 300,
    multiplier: '0x',
    win: 0,
    date: '27 Aout 2026',
  },
  {
    id: 8,
    game: 'Aviator',
    result: 'win',
    bet: 100,
    multiplier: '8.0x',
    win: 800,
    date: '27 Aout 2026',
  },
];

const stats = {
  totalGames: 47,
  totalWins: 28,
  totalLosses: 19,
  totalBet: 15000,
  totalWin: 22500,
  biggestWin: 5000,
  favoriteGame: 'Aviator',
};

export default function GamesHistoryPage() {
  const winRate = ((stats.totalWins / stats.totalGames) * 100).toFixed(1);
  const profit = stats.totalWin - stats.totalBet;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Mes Jeux</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Historique et statistiques de vos jeux
          </p>
        </div>
        <Link href="/games" className="btn btn-primary">
          Jouer maintenant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
            {stats.totalGames}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Parties jouées</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{winRate}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Taux de victoire</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: '24px', fontWeight: 700, color: profit > 0 ? '#22c55e' : '#ef4444' }}
          >
            {profit > 0 ? '+' : ''}
            {profit.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profit net</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {stats.biggestWin.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Plus gros gain</div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        {[
          { name: 'Aviator', games: 32, wins: 21, profit: 8500 },
          { name: 'Spin & Win', games: 10, wins: 5, profit: 2000 },
          { name: 'Apple Fortunes', games: 5, wins: 2, profit: -1500 },
        ].map((game, i) => (
          <div key={i} className="card">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {game.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{game.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {game.games} parties
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Victoires: {game.wins}</span>
              <span style={{ color: game.profit > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {game.profit > 0 ? '+' : ''}
                {game.profit.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Historique des parties
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gameHistory.map((game) => (
            <div
              key={game.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: game.result === 'win' ? '#f0fdf4' : '#fef2f2',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: game.result === 'win' ? '#dcfce7' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: game.result === 'win' ? 'var(--success)' : 'var(--error)',
                  flexShrink: 0,
                }}
              >
                {game.game.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{game.game}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{game.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: game.result === 'win' ? '#22c55e' : '#ef4444',
                  }}
                >
                  {game.result === 'win'
                    ? `+${game.win.toLocaleString()}`
                    : `-${game.bet.toLocaleString()}`}{' '}
                  FCFA
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {game.multiplier} • Mise: {game.bet.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
