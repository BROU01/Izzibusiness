'use client';

import Link from 'next/link';
import Leaderboard from '@/components/games/Leaderboard';
import { useWallet } from '@/hooks/useWallet';
import { REFERRAL_BONUS, formatFcfa } from '@/lib/config';

const quickActions = [
  { title: 'Jouer à Aviator', description: 'Tentez de gagner des prix', href: '/games' },
  {
    title: 'Recharger mon wallet',
    description: 'Ajoutez des fonds via Mobile Money',
    href: '/dashboard/wallet',
  },
  { title: 'Voir les formations', description: '9 formations incluses', href: '/formations' },
  {
    title: 'Partager mon lien',
    description: `Gagnez ${formatFcfa(REFERRAL_BONUS)} par filleul actif`,
    href: '/dashboard/referrals',
  },
];

export default function DashboardPage() {
  const { balance, gameBalance, currency, loading } = useWallet();

  const stats = [
    {
      label: 'Solde Wallet',
      value: loading ? '…' : formatFcfa(balance),
      link: '/dashboard/wallet',
    },
    {
      label: 'Gains Jeux',
      value: loading ? '…' : formatFcfa(gameBalance),
      link: '/dashboard/games',
    },
    { label: 'Missions', value: 'Suivi des tâches', link: '/dashboard/missions' },
    {
      label: 'Affiliation',
      value: `${formatFcfa(REFERRAL_BONUS)} / filleul`,
      link: '/dashboard/referrals',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Bonjour</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Voici votre résumé Izzibusiness
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.link}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Actions rapides</h2>
        <div className="grid grid-2">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="card"
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                  {action.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity + Leaderboard */}
      <div className="grid grid-2" style={{ gap: '24px' }}>
        {/* Wallet shortcut */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Mon wallet</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Solde principal</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                {loading ? '…' : `${balance.toLocaleString('fr-FR')} ${currency}`}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Solde de jeux</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
                {loading ? '…' : `${gameBalance.toLocaleString('fr-FR')} ${currency}`}
              </span>
            </div>
            <Link
              href="/dashboard/wallet"
              className="btn btn-primary"
              style={{ textAlign: 'center', marginTop: '4px' }}
            >
              Gérer mes fonds
            </Link>
          </div>
        </div>

        {/* Mini Leaderboard */}
        <div>
          <Leaderboard title="Top Joueurs" showFilters={false} compact={true} limit={5} />
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link
              href="/leaderboard"
              style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}
            >
              Voir le classement complet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
