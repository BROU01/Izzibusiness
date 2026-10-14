'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/lib/api-client';
import { GAME_LABELS } from '@/lib/labels';

type Enabled = { spin: boolean; apple: boolean; aviator: boolean };

/** Interrupteurs d'ouverture des jeux (effet immédiat sur les nouvelles mises). */
export default function GameToggles({ initial }: { initial: Enabled }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(game: keyof Enabled) {
    const next = { ...enabled, [game]: !enabled[game] };
    setBusy(true);
    setError(null);
    const res = await postJson('/api/admin/games', { enabled: next });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setEnabled(next);
    router.refresh();
  }

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(enabled) as (keyof Enabled)[]).map((game) => (
          <li key={game} className="card-flat flex items-center justify-between gap-3">
            <span>
              <span className="block font-display text-xl font-black">{GAME_LABELS[game]}</span>
              <span className={`badge mt-1 ${enabled[game] ? 'badge-grass' : 'badge-flame'}`}>
                {enabled[game] ? 'Ouvert' : 'Fermé'}
              </span>
            </span>
            <button
              type="button"
              className="btn btn-ghost px-3 py-2 text-xs"
              disabled={busy}
              onClick={() => toggle(game)}
              aria-pressed={enabled[game]}
            >
              {enabled[game] ? 'Fermer' : 'Ouvrir'}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 font-semibold text-[#b8320d]">
          {error}
        </p>
      )}
    </div>
  );
}
