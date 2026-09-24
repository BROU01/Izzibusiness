'use client';

import { useMemo, useState } from 'react';

export interface Player {
  name: string;
  avatar: string;
  score: number;
  weeklyScore: number;
  monthlyScore: number;
  badge: string;
  gamesPlayed: number;
  wins: number;
  /** Catégorie de classement : joueur de jeu, apprenant ou opérateur de mission. */
  category?: 'jeux' | 'formations' | 'missions';
}

export const MOCK_PLAYERS: Player[] = [
  {
    name: 'Koffi A.',
    avatar: '🏆',
    score: 4820,
    weeklyScore: 820,
    monthlyScore: 2100,
    badge: 'Légende',
    gamesPlayed: 312,
    wins: 214,
  },
  {
    name: 'Awa D.',
    avatar: '🔥',
    score: 4510,
    weeklyScore: 760,
    monthlyScore: 1980,
    badge: 'Maître',
    gamesPlayed: 288,
    wins: 196,
  },
  {
    name: 'Yao K.',
    avatar: '⭐',
    score: 4230,
    weeklyScore: 700,
    monthlyScore: 1840,
    badge: 'Expert',
    gamesPlayed: 264,
    wins: 178,
  },
  {
    name: 'Fatou S.',
    avatar: '💎',
    score: 3980,
    weeklyScore: 640,
    monthlyScore: 1720,
    badge: 'Expert',
    gamesPlayed: 245,
    wins: 161,
  },
  {
    name: 'Moussa B.',
    avatar: '🎯',
    score: 3720,
    weeklyScore: 590,
    monthlyScore: 1600,
    badge: 'Vétéran',
    gamesPlayed: 231,
    wins: 152,
  },
  {
    name: 'Akissi M.',
    avatar: '🚀',
    score: 3410,
    weeklyScore: 540,
    monthlyScore: 1480,
    badge: 'Vétéran',
    gamesPlayed: 214,
    wins: 138,
  },
  {
    name: 'Serge T.',
    avatar: '⚡',
    score: 3180,
    weeklyScore: 500,
    monthlyScore: 1360,
    badge: 'Confirmé',
    gamesPlayed: 198,
    wins: 121,
  },
  {
    name: 'Nadia O.',
    avatar: '🌟',
    score: 2940,
    weeklyScore: 460,
    monthlyScore: 1240,
    badge: 'Confirmé',
    gamesPlayed: 186,
    wins: 113,
  },
  {
    name: 'Ibrahim C.',
    avatar: '🏅',
    score: 2710,
    weeklyScore: 420,
    monthlyScore: 1120,
    badge: 'Rising',
    gamesPlayed: 172,
    wins: 98,
  },
  {
    name: 'Léa P.',
    avatar: '✨',
    score: 2480,
    weeklyScore: 380,
    monthlyScore: 1010,
    badge: 'Rising',
    gamesPlayed: 158,
    wins: 87,
  },
];

export const MOCK_LEARNERS: Player[] = [
  {
    name: 'Mariam M.',
    avatar: '📘',
    score: 3960,
    weeklyScore: 720,
    monthlyScore: 1890,
    badge: 'Assidue',
    gamesPlayed: 19,
    wins: 17,
  },
  {
    name: 'Drissa O.',
    avatar: '📗',
    score: 3640,
    weeklyScore: 660,
    monthlyScore: 1710,
    badge: 'Assidu',
    gamesPlayed: 18,
    wins: 15,
  },
  {
    name: 'Adjoua B.',
    avatar: '📙',
    score: 3280,
    weeklyScore: 600,
    monthlyScore: 1540,
    badge: 'Progression',
    gamesPlayed: 17,
    wins: 14,
  },
  {
    name: 'Kwame N.',
    avatar: '🎓',
    score: 2950,
    weeklyScore: 540,
    monthlyScore: 1390,
    badge: 'Progression',
    gamesPlayed: 16,
    wins: 12,
  },
  {
    name: 'Aïcha D.',
    avatar: '📗',
    score: 2610,
    weeklyScore: 470,
    monthlyScore: 1230,
    badge: 'Débutante',
    gamesPlayed: 14,
    wins: 10,
  },
  {
    name: 'Séverin K.',
    avatar: '📘',
    score: 2270,
    weeklyScore: 410,
    monthlyScore: 1070,
    badge: 'Débutant',
    gamesPlayed: 13,
    wins: 9,
  },
];

export const MOCK_OPERATORS: Player[] = [
  {
    name: 'Bakary S.',
    avatar: '🛠️',
    score: 4410,
    weeklyScore: 780,
    monthlyScore: 2020,
    badge: 'Élite',
    gamesPlayed: 27,
    wins: 25,
  },
  {
    name: 'Rokia T.',
    avatar: '📋',
    score: 4080,
    weeklyScore: 710,
    monthlyScore: 1870,
    badge: 'Élite',
    gamesPlayed: 25,
    wins: 23,
  },
  {
    name: 'Yves A.',
    avatar: '🚚',
    score: 3690,
    weeklyScore: 640,
    monthlyScore: 1680,
    badge: 'Fiable',
    gamesPlayed: 23,
    wins: 20,
  },
  {
    name: 'Salimata D.',
    avatar: '📦',
    score: 3350,
    weeklyScore: 580,
    monthlyScore: 1520,
    badge: 'Fiable',
    gamesPlayed: 21,
    wins: 18,
  },
  {
    name: 'Hamed K.',
    avatar: '🧰',
    score: 3020,
    weeklyScore: 520,
    monthlyScore: 1370,
    badge: 'Actif',
    gamesPlayed: 19,
    wins: 15,
  },
  {
    name: 'Grâce Y.',
    avatar: '📂',
    score: 2680,
    weeklyScore: 450,
    monthlyScore: 1210,
    badge: 'Actif',
    gamesPlayed: 17,
    wins: 13,
  },
];

export const MOCK_ALL_PLAYERS: Player[] = [...MOCK_PLAYERS, ...MOCK_LEARNERS, ...MOCK_OPERATORS];

function scoreOf(p: Player, view: 'weekly' | 'monthly' | 'all'): number {
  if (view === 'weekly') return p.weeklyScore;
  if (view === 'monthly') return p.monthlyScore;
  return p.score;
}

type View = 'weekly' | 'monthly' | 'all';

type LeaderboardProps = {
  /** Liste à afficher. Par défaut : tous les classements (jeux, formations, missions). */
  players?: Player[];
  /** Titre de la section. */
  title?: string;
  /** Affiche les boutons de période (Semaine / Mois / Tout). */
  showFilters?: boolean;
  /** Version réduite : sans podium ni filtres, pour les panneaux latéraux. */
  compact?: boolean;
  /** Nombre maximum de lignes affichées. */
  limit?: number;
  /** Filtre par catégorie de classement. */
  filter?: 'global' | 'jeux' | 'formations' | 'missions';
};

const VIEWS: { id: View; label: string }[] = [
  { id: 'weekly', label: 'Semaine' },
  { id: 'monthly', label: 'Mois' },
  { id: 'all', label: 'Tout' },
];

export default function Leaderboard({
  players,
  title = 'Meilleurs joueurs',
  showFilters = true,
  compact = false,
  limit,
  filter = 'global',
}: LeaderboardProps) {
  const [view, setView] = useState<View>('all');

  const sorted = useMemo(() => {
    const pool = players ?? MOCK_ALL_PLAYERS;
    const filtered =
      filter === 'global' ? pool : pool.filter((p) => (p.category ?? 'jeux') === filter);
    return [...filtered].sort((a, b) => scoreOf(b, view) - scoreOf(a, view));
  }, [players, filter, view]);

  const shown = limit !== undefined ? sorted.slice(0, limit) : sorted;
  const showPodium = !compact && shown.length >= 3;
  const top3 = showPodium ? shown.slice(0, 3) : [];
  const rest = showPodium ? shown.slice(3) : shown;
  const rankOffset = showPodium ? 3 : 0;
  const showPeriod = showFilters && !compact;

  return (
    <section aria-labelledby="leaderboard-title" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {!compact && (
            <p className="eyebrow">{limit !== undefined ? `[ TOP ${limit} ]` : '[ CLASSEMENT ]'}</p>
          )}
          <h2
            id="leaderboard-title"
            className={`${compact ? '' : 'mt-2 '}font-display text-2xl font-black`}
          >
            {title}
          </h2>
        </div>
        {showPeriod && (
          <div className="flex gap-2" role="group" aria-label="Periode affichee">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`btn px-3 py-1.5 text-xs ${
                  view === v.id ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-5 border-[3px] border-dashed border-ink/40 p-6 text-center text-sm text-ink/70">
          Aucun classement dans cette catégorie pour le moment.
        </p>
      ) : (
        <>
          {/* Podium */}
          {showPodium && (
            <ol className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Podium">
              {top3.map((p, i) => (
                <li
                  key={p.name}
                  className={`border-[3px] border-ink bg-paper p-4 shadow-hard-sm ${
                    i === 0 ? '-translate-y-1' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl" aria-hidden="true">
                      {p.avatar}
                    </span>
                    <span
                      className={`badge ${
                        i === 0
                          ? 'bg-acid text-ink'
                          : i === 1
                            ? 'bg-ink text-paper'
                            : 'bg-flame text-paper'
                      }`}
                    >
                      #{i + 1}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg font-black leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-xs text-ink/70">{p.badge}</p>
                  <p className="mt-2 font-mono text-sm font-bold tabular-nums">
                    {scoreOf(p, view).toLocaleString('fr-FR')} pts
                  </p>
                </li>
              ))}
            </ol>
          )}

          {/* Liste */}
          <ol className="mt-4" aria-label={`Classement ${title}`}>
            {rest.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center gap-3 border-b-2 border-ink/15 py-3 last:border-b-0"
              >
                <span className="w-8 shrink-0 font-mono text-sm font-bold tabular-nums text-ink/60">
                  {String(rankOffset + i + 1).padStart(2, '0')}
                </span>
                <span className="text-xl" aria-hidden="true">
                  {p.avatar}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block text-xs text-ink/60">{p.badge}</span>
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {scoreOf(p, view).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
