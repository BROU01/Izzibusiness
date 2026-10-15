'use client';

import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { formatFcfa } from '@/lib/config';

interface Mission {
  id: string;
  title: string;
  description: string;
  proofInstructions: string;
  reward: number;
}

interface Submission {
  id: string;
  missionId: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
}

interface MissionsData {
  isMember: boolean;
  missions: Mission[];
  submissions: Submission[];
}

const STATUS_LABEL: Record<Submission['status'], string> = {
  pending: 'Preuve envoyée, en vérification',
  approved: 'Validée, récompense créditée',
  rejected: 'Refusée',
};

function SubmitProof({ mission, onSent }: { mission: Mission; onSent: () => void }) {
  const id = useId();
  const [proof, setProof] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const res = await postJson<{ status: string }>(`/api/missions/${mission.id}/submit`, { proof });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onSent();
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <label htmlFor={id} className="text-sm font-semibold">
        Ta preuve
      </label>
      <textarea
        id={id}
        className="input min-h-24"
        maxLength={1000}
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-ink-70">
        {mission.proofInstructions}
      </p>
      <button type="submit" className="btn btn-primary self-start" disabled={busy}>
        {busy ? 'Envoi…' : `Envoyer ma preuve pour ${formatFcfa(mission.reward)}`}
      </button>
    </form>
  );
}

export default function MissionsPage() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: MissionsData }
  >({ status: 'loading' });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let stop = false;
    void (async () => {
      try {
        const res = await fetch('/api/missions', { cache: 'no-store' });
        const payload = (await res.json()) as { data?: MissionsData };
        if (stop) return;
        if (!res.ok || !payload.data) throw new Error('load');
        setState({ status: 'ready', data: payload.data });
      } catch {
        if (!stop) setState({ status: 'error' });
      }
    })();
    return () => {
      stop = true;
    };
  }, [version]);

  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title="Missions"
        description="Des tâches publiées par l’équipe, rémunérées sur ton wallet après vérification de ta preuve."
      />

      {state.status === 'loading' && (
        <p role="status" className="font-mono text-sm uppercase tracking-wider">
          Chargement des missions…
        </p>
      )}
      {state.status === 'error' && (
        <div>
          <FormAlert tone="error">Les missions n’ont pas pu être chargées.</FormAlert>
          <button type="button" className="btn btn-primary mt-4" onClick={reload}>
            Réessayer
          </button>
        </div>
      )}
      {state.status === 'ready' && state.data.missions.length === 0 && (
        <EmptyState
          title="Aucune mission ouverte"
          description="Les nouvelles missions apparaîtront ici avec leur rémunération exacte. Tu recevras une notification."
          action={{ href: '/dashboard/onboarding/calendar', label: 'Avancer dans le programme' }}
        />
      )}
      {state.status === 'ready' && state.data.missions.length > 0 && (
        <>
          {!state.data.isMember && (
            <div className="mb-6">
              <FormAlert tone="error">
                Les missions sont réservées aux adhérents.{' '}
                <Link href="/dashboard/wallet" className="underline">
                  Activer mon adhésion
                </Link>
              </FormAlert>
            </div>
          )}
          <ul className="grid gap-6 lg:grid-cols-2">
            {state.data.missions.map((mission) => {
              const submission = state.data.submissions.find((s) => s.missionId === mission.id);
              return (
                <li key={mission.id} className="card">
                  <p className="badge badge-acid">{formatFcfa(mission.reward)}</p>
                  <h2 className="mt-3 text-2xl">{mission.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-ink-70">{mission.description}</p>
                  {submission ? (
                    <p className="mt-4 border-3 border-ink px-3 py-2 font-semibold">
                      {STATUS_LABEL[submission.status]}
                      {submission.note && (
                        <span className="block text-sm font-normal text-ink-70">
                          Motif : {submission.note}
                        </span>
                      )}
                    </p>
                  ) : state.data.isMember ? (
                    <SubmitProof mission={mission} onSent={reload} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
