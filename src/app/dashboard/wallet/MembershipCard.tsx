'use client';

import { useState } from 'react';
import { FormAlert } from '@/components/auth/FormField';
import { postJson } from '@/lib/api-client';
import { ADHESION_FEE, formatFcfa } from '@/lib/config';

/** Adhésion : par Mobile Money (PayDunya) ou avec le solde du wallet. */
export default function MembershipCard({
  balance,
  onPaid,
}: {
  balance: number;
  onPaid: () => void;
}) {
  const [pending, setPending] = useState<'paydunya' | 'wallet' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(method: 'paydunya' | 'wallet') {
    setError(null);
    setPending(method);
    const result = await postJson<{ checkoutUrl?: string; status?: string }>('/api/membership', {
      method,
    });
    if (!result.ok) {
      setError(result.error.message);
      setPending(null);
      return;
    }
    if (result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    setPending(null);
    onPaid();
  }

  return (
    <section className="card" aria-labelledby="membership-title">
      <p className="eyebrow">À faire</p>
      <h2 id="membership-title" className="mt-2 text-2xl">
        Activer ton adhésion
      </h2>
      <p className="mt-2 text-ink-70">
        {formatFcfa(ADHESION_FEE)}, une seule fois. Elle débloque les jeux, les missions et les
        retraits.
      </p>
      {error && (
        <div className="mt-4">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending !== null}
          onClick={() => pay('paydunya')}
        >
          {pending === 'paydunya'
            ? 'Ouverture du paiement…'
            : `Payer ${formatFcfa(ADHESION_FEE)} par Mobile Money`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pending !== null || balance < ADHESION_FEE}
          onClick={() => pay('wallet')}
        >
          {pending === 'wallet' ? 'Paiement…' : 'Payer avec mon solde'}
        </button>
      </div>
      {balance < ADHESION_FEE && (
        <p className="mt-2 text-sm text-ink-70">
          Le paiement avec le solde demande au moins {formatFcfa(ADHESION_FEE)} sur ton wallet.
        </p>
      )}
    </section>
  );
}
