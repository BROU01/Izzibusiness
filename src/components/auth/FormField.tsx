'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/** Champ texte étiqueté, avec erreur annoncée aux lecteurs d'écran. */
export function FormField({ label, error, hint, ...input }: FormFieldProps) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-[#b8320d]">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  autoComplete: 'current-password' | 'new-password';
}

/** Mot de passe avec bouton « Afficher » accessible au clavier. */
export function PasswordField({ label, error, hint, ...input }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input min-w-0 flex-1"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          aria-pressed={visible}
          className="-ml-[3px] border-3 border-ink bg-paper-2 px-3 font-mono text-xs font-bold uppercase tracking-wider hover:bg-acid"
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-[#b8320d]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bandeau d'erreur ou de succès global du formulaire. */
export function FormAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`border-3 border-ink px-4 py-3 text-sm font-semibold ${
        tone === 'error' ? 'bg-[#ffe1d6]' : 'bg-[#d6f5e8]'
      }`}
    >
      {children}
    </div>
  );
}
