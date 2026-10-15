'use client';

import { useId } from 'react';
import { formatFcfa } from '@/lib/config';

const QUICK = [100, 500, 1000, 5000];

/** Saisie de la mise, bornée par les règles serveur. */
export default function BetInput({
  value,
  onChange,
  min,
  max,
  balance,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  balance: number;
  disabled?: boolean;
}) {
  const id = useId();
  const invalid = value < min || value > max;
  const tooHigh = value > balance;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        Mise (FCFA)
      </label>
      <input
        id={id}
        className="input"
        inputMode="numeric"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        aria-invalid={invalid || tooHigh ? true : undefined}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="mt-1 text-xs text-ink-70">
        {tooHigh
          ? `Solde insuffisant (${formatFcfa(balance)}).`
          : `Entre ${formatFcfa(min)} et ${formatFcfa(max)}.`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {QUICK.filter((q) => q >= min && q <= max).map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            className={`badge cursor-pointer px-3 py-2 ${value === q ? 'badge-acid' : ''}`}
            aria-pressed={value === q}
            onClick={() => onChange(q)}
          >
            {formatFcfa(q)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function isBetValid(bet: number, min: number, max: number, balance: number) {
  return Number.isInteger(bet) && bet >= min && bet <= max && bet <= balance;
}
