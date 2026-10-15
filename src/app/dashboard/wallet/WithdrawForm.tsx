'use client';

import { useId, useState, type FormEvent } from 'react';
import { FormAlert, FormField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { MIN_WITHDRAWAL, WITHDRAWAL_FEE_RATE, WITHDRAW_OPERATORS, formatFcfa } from '@/lib/config';

/** Demande de retrait vers le numéro Mobile Money du compte. */
export default function WithdrawForm({
  balance,
  country,
  phone,
  onRequested,
}: {
  balance: number;
  country: string | null;
  phone: string | null;
  onRequested: () => void;
}) {
  const operators = WITHDRAW_OPERATORS[country ?? ''] ?? [];
  const operatorId = useId();
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState(operators[0]?.mode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const value = Number(amount);
  const fee = Number.isFinite(value) ? Math.ceil(value * WITHDRAWAL_FEE_RATE) : 0;
  const total = value + fee;

  if (operators.length === 0) {
    return (
      <section className="card">
        <h2 className="text-2xl">Retirer</h2>
        <p className="mt-2 text-ink-70">
          Les retraits Mobile Money ne sont pas encore disponibles pour ton pays. Contacte le
          support pour une solution.
        </p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!Number.isInteger(value) || value < MIN_WITHDRAWAL) {
      setError(`Retrait minimum : ${formatFcfa(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (total > balance) {
      setError(`Solde insuffisant : il faut ${formatFcfa(total)} (montant + frais).`);
      return;
    }
    setSubmitting(true);
    const result = await postJson<{ amount: number }>('/api/wallet/withdraw', {
      amount: value,
      operator,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setAmount('');
    setSuccess(
      `Demande enregistrée : ${formatFcfa(value)} seront envoyés après vérification (généralement sous 24 h).`,
    );
    onRequested();
  }

  return (
    <section className="card" aria-labelledby="withdraw-title">
      <h2 id="withdraw-title" className="text-2xl">
        Retirer
      </h2>
      <p className="mt-1 text-sm text-ink-70">
        Envoi vers ton numéro {phone ?? ''}. Frais :{' '}
        {(WITHDRAWAL_FEE_RATE * 100).toLocaleString('fr-FR')} %.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}
        {success && <FormAlert tone="success">{success}</FormAlert>}
        <FormField
          label="Montant à recevoir (FCFA)"
          name="amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          hint={`Minimum ${formatFcfa(MIN_WITHDRAWAL)}.`}
        />
        <div>
          <label htmlFor={operatorId} className="mb-1.5 block text-sm font-semibold">
            Opérateur
          </label>
          <select
            id={operatorId}
            className="input"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          >
            {operators.map((o) => (
              <option key={o.mode} value={o.mode}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {value > 0 && (
          <p className="font-mono text-sm">
            Débité du wallet : {formatFcfa(total)} (dont {formatFcfa(fee)} de frais)
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? 'Envoi de la demande…'
            : value >= MIN_WITHDRAWAL
              ? `Demander le retrait de ${formatFcfa(value)}`
              : 'Demander le retrait'}
        </button>
      </form>
    </section>
  );
}
