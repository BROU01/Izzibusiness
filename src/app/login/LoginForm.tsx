'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { FormAlert, FormField, PasswordField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { safeRedirectPath } from '@/lib/auth/schemas';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get('redirect'));
  const linkExpired = searchParams.get('error') === 'link_expired';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    linkExpired ? 'Ce lien a expiré ou a déjà été utilisé. Connecte-toi directement.' : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Indique ton pseudo (ou e-mail) et ton mot de passe.');
      return;
    }

    setSubmitting(true);
    const result = await postJson<{ status: string }>('/api/auth/login', {
      identifier,
      password,
    });

    if (!result.ok) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    // refresh : les composants serveur relisent la session fraîchement posée.
    router.replace(redirectPath);
    router.refresh();
  }

  const registerHref =
    redirectPath === '/dashboard'
      ? '/register'
      : `/register?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <AuthShell
      eyebrow="Accès membre"
      title="Content de te revoir."
      intro="Retrouve ta boutique, ton wallet et ta progression là où tu les as laissés."
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link href={registerHref} className="font-bold underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <FormField
          label="Pseudo ou adresse e-mail"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <div>
          <PasswordField
            label="Mot de passe"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link
            href="/forgot-password"
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-4"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>
    </AuthShell>
  );
}
