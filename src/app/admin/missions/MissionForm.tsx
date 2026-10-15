'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlert, FormField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';

const EMPTY = { title: '', description: '', proofInstructions: '', reward: '', maxCompletions: '' };

/** Création d'une mission (brouillon ou publiée directement). */
export default function MissionForm() {
  const router = useRouter();
  const descId = useId();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>, status: 'draft' | 'open') {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await postJson<{ id: string }>('/api/admin/missions', {
      title: values.title,
      description: values.description,
      proofInstructions: values.proofInstructions,
      reward: Number(values.reward),
      maxCompletions: values.maxCompletions ? Number(values.maxCompletions) : null,
      status,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setValues(EMPTY);
    setSuccess(status === 'open' ? 'Mission publiée.' : 'Brouillon enregistré.');
    router.refresh();
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={(e) => submit(e, 'open')} noValidate>
      <h2 className="text-2xl">Nouvelle mission</h2>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {success && <FormAlert tone="success">{success}</FormAlert>}
      <FormField
        label="Titre"
        maxLength={120}
        value={values.title}
        onChange={(e) => set('title')(e.target.value)}
      />
      <div>
        <label htmlFor={descId} className="mb-1.5 block text-sm font-semibold">
          Description (ce qu’il faut faire)
        </label>
        <textarea
          id={descId}
          className="input min-h-28"
          maxLength={2000}
          value={values.description}
          onChange={(e) => set('description')(e.target.value)}
        />
      </div>
      <FormField
        label="Preuve demandée"
        hint="Ex. lien de la publication, numéro de commande, capture décrite…"
        maxLength={500}
        value={values.proofInstructions}
        onChange={(e) => set('proofInstructions')(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Récompense (FCFA)"
          inputMode="numeric"
          value={values.reward}
          onChange={(e) => set('reward')(e.target.value.replace(/\D/g, ''))}
        />
        <FormField
          label="Nombre maximal de validations"
          hint="Laisser vide : illimité."
          inputMode="numeric"
          value={values.maxCompletions}
          onChange={(e) => set('maxCompletions')(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Publier la mission'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={(e) => submit(e as unknown as FormEvent<HTMLFormElement>, 'draft')}
        >
          Enregistrer en brouillon
        </button>
      </div>
    </form>
  );
}
