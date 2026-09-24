'use client';

import { useState } from 'react';
import Link from 'next/link';
import Leaderboard from '@/components/games/Leaderboard';

type Tab = 'global' | 'jeux' | 'formations' | 'missions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'jeux', label: 'Jeux' },
  { id: 'formations', label: 'Formations' },
  { id: 'missions', label: 'Missions' },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('global');

  return (
    <div className="container section">
      {/* Masthead */}
      <div className="rule" />
      <p className="eyebrow">[ 00 ] Classement</p>
      <div className="rule mb-4" />
      <div className="grid-2 items-end gap-6">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 7vw, 5rem)',
              fontWeight: 900,
              lineHeight: 0.9,
              textTransform: 'uppercase',
            }}
          >
            Tableau
            <br />
            <span style={{ color: 'var(--flame)' }}>d&apos;honneur</span>
          </h1>
          <p
            className="mt-3"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--ink-70)',
              maxWidth: '44ch',
            }}
          >
            Les meilleurs joueurs d&apos;Izzibusiness, mis à jour en continu. Points cumulés,
            récompenses réelles.
          </p>
        </div>
        <div className="card p-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          <p className="eyebrow">Saison en cours</p>
          <ul className="mt-2 space-y-1">
            <li className="flex justify-between">
              <span>Points distribués</span>
              <strong>486 200</strong>
            </li>
            <li className="flex justify-between">
              <span>Joueurs classés</span>
              <strong>1 204</strong>
            </li>
            <li className="flex justify-between">
              <span>Récompenses versées</span>
              <strong>245 000 FCFA</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Onglets */}
      <div role="tablist" aria-label="Filtrer le classement" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="btn"
            style={
              tab === t.id
                ? { background: 'var(--acid)', color: 'var(--ink)' }
                : { background: 'var(--paper)', color: 'var(--ink)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <Leaderboard filter={tab} />

      {/* Récompenses */}
      <div className="card p-5 mt-8" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--acid)',
          }}
        >
          [ Récompenses du mois ]
        </p>
        <div className="grid-3 gap-4 mt-3">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '2rem',
                color: 'var(--acid)',
              }}
            >
              2 500
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--paper-70)',
              }}
            >
              FCFA — 1re place
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '2rem',
                color: 'var(--acid)',
              }}
            >
              1 500
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--paper-70)',
              }}
            >
              FCFA — 2e place
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '2rem',
                color: 'var(--acid)',
              }}
            >
              1 000
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--paper-70)',
              }}
            >
              FCFA — 3e place
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="grid-3 gap-4 mt-6">
        <Link href="/games" className="btn btn-primary">
          Monter au classement
        </Link>
        <Link href="/dashboard/missions" className="btn btn-secondary">
          Prendre une mission
        </Link>
        <Link href="/formations" className="btn btn-secondary">
          Suivre une formation
        </Link>
      </div>
    </div>
  );
}
