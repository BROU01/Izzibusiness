'use client';

import { useId, useState, type FormEvent } from 'react';
import { FormAlert, FormField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';

/** Annonce envoyée dans le centre de notifications des membres. */
export default function BroadcastForm() {
  const messageId = useId();
  const audienceId = useId();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'members'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = audience === 'all' ? 'tous les comptes actifs' : 'tous les adhérents';
    if (!window.confirm(`Envoyer cette annonce à ${target} ?`)) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await postJson<{ sent: number }>('/api/admin/notifications', {
      title,
      message,
      audience,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setTitle('');
    setMessage('');
    setSuccess(`Annonce envoyée à ${res.data.sent} compte(s).`);
  }

  return (
    <form onSubmit={submit} className="card flex max-w-2xl flex-col gap-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {success && <FormAlert tone="success">{success}</FormAlert>}
      <FormField
        label="Titre"
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div>
        <label htmlFor={messageId} className="mb-1.5 block text-sm font-semibold">
          Message
        </label>
        <textarea
          id={messageId}
          className="input min-h-28"
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={audienceId} className="mb-1.5 block text-sm font-semibold">
          Destinataires
        </label>
        <select
          id={audienceId}
          className="input"
          value={audience}
          onChange={(e) => setAudience(e.target.value === 'members' ? 'members' : 'all')}
        >
          <option value="all">Tous les comptes actifs</option>
          <option value="members">Adhérents uniquement</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary self-start" disabled={busy}>
        {busy ? 'Envoi…' : 'Envoyer l’annonce'}
      </button>
    </form>
  );
}
