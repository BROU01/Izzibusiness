'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { FormAlert, PasswordField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { fieldErrors, PASSWORD_MIN, resetPasswordSchema } from '@/lib/auth/schemas';

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    const result = await postJson<{ status: string }>('/api/auth/reset-password', {
      ...parsed.data,
      token,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.error.fields);
      setFormError(result.error.message);
      return;
    }

    router.replace('/login?reset=1');
  }

  if (!token) {
    return (
      <AuthShell
        eyebrow="Récupération"
        title="Ce lien n’est plus valable."
        intro="Un lien de réinitialisation sert une seule fois et expire au bout d’une heure."
        footer={
          <p>
            <Link href="/login" className="font-bold underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        }
      >
        <Link href="/forgot-password" className="btn btn-primary w-full">
          Recevoir un nouveau lien
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Récupération"
      title="Choisis un nouveau mot de passe."
      intro="Il remplacera l’ancien immédiatement. Tes autres appareils seront déconnectés."
      footer={
        <p>
          <Link href="/login" className="font-bold underline underline-offset-4">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}
        <PasswordField
          label="Nouveau mot de passe"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={`${PASSWORD_MIN} caractères minimum.`}
        />
        <PasswordField
          label="Confirme le mot de passe"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </AuthShell>
  );
}
