'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { FormAlert, FormField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { forgotPasswordSchema } from '@/lib/auth/schemas';

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get('error') === 'link_expired';

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(
    linkExpired ? 'Ce lien a expiré ou a déjà servi. Demande un nouveau lien ci-dessous.' : null,
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError('Indique une adresse e-mail valide.');
      return;
    }

    setSubmitting(true);
    const result = await postJson<{ status: string }>('/api/auth/forgot-password', parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSentTo(parsed.data.email);
  }

  return (
    <AuthShell
      eyebrow="Récupération"
      title="Mot de passe oublié."
      intro="Indique l’adresse e-mail de ton compte : tu recevras un lien pour en choisir un nouveau."
      footer={
        <p>
          Tu t’en souviens ?{' '}
          <Link href="/login" className="font-bold underline underline-offset-4">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      {sentTo ? (
        <FormAlert tone="success">
          Si un compte existe pour <strong>{sentTo}</strong>, un lien de réinitialisation vient
          d’être envoyé. Il est valable une heure.
        </FormAlert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {error && <FormAlert tone="error">{error}</FormAlert>}
          <FormField
            label="Adresse e-mail"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Recevoir le lien'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
