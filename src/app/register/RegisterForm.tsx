'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { FormAlert, FormField, PasswordField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { COUNTRIES, findCountry } from '@/lib/auth/countries';
import { fieldErrors, PASSWORD_MIN, registerSchema, safeRedirectPath } from '@/lib/auth/schemas';
import { ADHESION_FEE, formatFcfa } from '@/lib/config';

type Fields = {
  username: string;
  email: string;
  country: string;
  phone: string;
  referralCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get('redirect'));
  // Le code vient du lien de parrainage : non modifiable pour éviter les erreurs de saisie.
  const referralFromLink = (searchParams.get('ref') ?? '').trim().toUpperCase();

  const countryId = useId();
  const phoneId = useId();
  const termsId = useId();

  const [fields, setFields] = useState<Fields>({
    username: '',
    email: '',
    country: 'BJ',
    phone: '',
    referralCode: referralFromLink,
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const country = findCountry(fields.country);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = registerSchema.safeParse(fields);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError('Corrige les champs signalés pour continuer.');
      return;
    }

    setSubmitting(true);
    const result = await postJson<{ status: 'signed_in' }>('/api/auth/register', fields);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.error.fields);
      setFormError(result.error.message);
      return;
    }

    router.replace(redirectPath);
    router.refresh();
  }

  const loginHref =
    redirectPath === '/dashboard'
      ? '/login'
      : `/login?redirect=${encodeURIComponent(redirectPath)}`;

  const footer = (
    <p>
      Déjà inscrit ?{' '}
      <Link href={loginHref} className="font-bold underline underline-offset-4">
        Se connecter
      </Link>
    </p>
  );

  return (
    <AuthShell
      eyebrow="Inscription gratuite"
      title="Ouvre ton compte."
      intro="Un compte suffit pour acheter sur le marché, ouvrir ta boutique et suivre tes gains."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <FormField
          label="Pseudo"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          required
          value={fields.username}
          onChange={(e) => update('username', e.target.value)}
          error={errors.username}
          hint="3 à 20 caractères : lettres minuscules, chiffres ou _. Il sert à te connecter."
        />

        <FormField
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={fields.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
        />

        <div>
          <label htmlFor={countryId} className="mb-1.5 block text-sm font-semibold">
            Pays
          </label>
          <select
            id={countryId}
            name="country"
            className="input"
            autoComplete="country"
            value={fields.country}
            onChange={(e) => update('country', e.target.value)}
            aria-invalid={errors.country ? true : undefined}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-sm font-semibold text-[#b8320d]">{errors.country}</p>
          )}
        </div>

        <div>
          <label htmlFor={phoneId} className="mb-1.5 block text-sm font-semibold">
            Téléphone Mobile Money
          </label>
          <div className="flex">
            <span
              className="flex items-center border-3 border-ink bg-paper-2 px-3 font-mono text-sm font-bold"
              aria-hidden="true"
            >
              +{country?.dial}
            </span>
            <input
              id={phoneId}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              className="input -ml-[3px] min-w-0 flex-1"
              required
              value={fields.phone}
              onChange={(e) => update('phone', e.target.value)}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={`${phoneId}-hint${errors.phone ? ` ${phoneId}-error` : ''}`}
            />
          </div>
          <p id={`${phoneId}-hint`} className="mt-1 text-xs text-ink-70">
            Sans l’indicatif +{country?.dial}. Ce numéro recevra tes paiements.
          </p>
          {errors.phone && (
            <p id={`${phoneId}-error`} className="mt-1 text-sm font-semibold text-[#b8320d]">
              {errors.phone}
            </p>
          )}
        </div>

        <FormField
          label="Code de parrainage (facultatif)"
          name="referralCode"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          readOnly={Boolean(referralFromLink)}
          value={fields.referralCode}
          onChange={(e) => update('referralCode', e.target.value)}
          error={errors.referralCode}
          hint={referralFromLink ? 'Appliqué depuis ton lien d’invitation.' : 'Format IZZ123ABC.'}
        />

        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          required
          value={fields.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
          hint={`${PASSWORD_MIN} caractères minimum.`}
        />

        <PasswordField
          label="Confirme le mot de passe"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={fields.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />

        <div>
          <div className="flex items-start gap-3">
            <input
              id={termsId}
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-[#14120d]"
              checked={fields.acceptTerms}
              onChange={(e) => update('acceptTerms', e.target.checked)}
              aria-invalid={errors.acceptTerms ? true : undefined}
            />
            <label htmlFor={termsId} className="text-sm">
              J’accepte les{' '}
              <Link href="/terms" className="font-bold underline underline-offset-4">
                conditions d’utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/privacy" className="font-bold underline underline-offset-4">
                politique de confidentialité
              </Link>
              .
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm font-semibold text-[#b8320d]">{errors.acceptTerms}</p>
          )}
        </div>

        <p className="border-l-[6px] border-acid bg-paper-2 px-3 py-2 text-sm">
          L’inscription est gratuite. L’adhésion ({formatFcfa(ADHESION_FEE)}) se règle ensuite
          depuis ton tableau de bord ; elle débloque les jeux, les missions et les retraits.
        </p>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthShell>
  );
}
