'use client';

import { useState, type FormEvent } from 'react';
import { FormAlert, FormField } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { MAX_DEPOSIT, MIN_DEPOSIT, formatFcfa } from '@/lib/config';

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];

/** Dépôt : redirige vers la page de paiement PayDunya. */
export default function DepositForm() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const value = Number(amount);
  const valid = Number.isInteger(value) && value >= MIN_DEPOSIT && value <= MAX_DEPOSIT;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!valid) {
      setError(
        `Choisis un montant entre ${formatFcfa(MIN_DEPOSIT)} et ${formatFcfa(MAX_DEPOSIT)}.`,
      );
      return;
    }
    setSubmitting(true);
    const result = await postJson<{ checkoutUrl: string }>('/api/wallet/deposit', {
      amount: value,
    });
    if (!result.ok) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }
    window.location.href = result.data.checkoutUrl;
  }

  return (
    <section className="card" aria-labelledby="deposit-title">
      <h2 id="deposit-title" className="text-2xl">
        Déposer
      </h2>
      <p className="mt-1 text-sm text-ink-70">
        Paiement Mobile Money sécurisé par PayDunya. Le solde est crédité dès la confirmation.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}
        <FormField
          label="Montant (FCFA)"
          name="amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          hint={`Entre ${formatFcfa(MIN_DEPOSIT)} et ${formatFcfa(MAX_DEPOSIT)}.`}
        />
        <div className="flex flex-wrap gap-2" aria-label="Montants rapides">
          {QUICK_AMOUNTS.map((quick) => (
            <button
              key={quick}
              type="button"
              className={`badge cursor-pointer px-3 py-2 ${value === quick ? 'badge-acid' : ''}`}
              onClick={() => setAmount(String(quick))}
              aria-pressed={value === quick}
            >
              {formatFcfa(quick)}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? 'Ouverture du paiement…'
            : valid
              ? `Déposer ${formatFcfa(value)}`
              : 'Déposer'}
        </button>
      </form>
    </section>
  );
}
