'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/lib/api-client';

/**
 * Action admin qui demande une saisie (motif de refus, montant d'ajustement).
 * Le formulaire s'ouvre sous le bouton ; rien n'est envoyé sans validation.
 */
export default function InputAction({
  url,
  label,
  submitLabel,
  fields,
  buildBody,
}: {
  url: string;
  label: string;
  submitLabel: string;
  fields: { name: string; label: string; type?: 'text' | 'number'; placeholder?: string }[];
  buildBody: (values: Record<string, string>) => unknown;
}) {
  const router = useRouter();
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await postJson(url, buildBody(values));
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setOpen(false);
    setValues({});
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost px-3 py-2 text-xs"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-3 border-ink bg-paper p-3">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${baseId}-${f.name}`} className="block text-xs font-semibold">
            {f.label}
          </label>
          <input
            id={`${baseId}-${f.name}`}
            className="input py-2 text-sm"
            inputMode={f.type === 'number' ? 'numeric' : undefined}
            placeholder={f.placeholder}
            value={values[f.name] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-xs font-semibold text-[#b8320d]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary px-3 py-2 text-xs" disabled={busy}>
          {busy ? 'Envoi…' : submitLabel}
        </button>
        <button
          type="button"
          className="btn btn-ghost px-3 py-2 text-xs"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
