import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { syncPaymentFromProvider, type SyncOutcome } from '@/lib/payments/sync';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<SyncOutcome, { title: string; text: string }> = {
  completed: { title: 'Paiement confirmé', text: 'Le montant est disponible dans ton espace.' },
  pending: {
    title: 'Paiement en cours de confirmation',
    text: 'L’opérateur n’a pas encore confirmé. Ton solde sera mis à jour automatiquement, tu recevras une notification.',
  },
  cancelled: { title: 'Paiement annulé', text: 'Aucun montant n’a été débité.' },
  failed: {
    title: 'Paiement refusé',
    text: 'L’opérateur a refusé le paiement ou le montant ne correspond pas. Aucun crédit n’a été fait.',
  },
  unknown: { title: 'Paiement introuvable', text: 'Ce lien ne correspond à aucun paiement.' },
};

/**
 * Retour depuis PayDunya (return_url, avec ?token=…). Le statut est relu
 * chez PayDunya : utile si l'IPN arrive après le retour du client.
 */
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let outcome: SyncOutcome = 'unknown';

  if (token && /^[A-Za-z0-9_-]{6,128}$/.test(token)) {
    const user = await getSessionUser();
    // Le paiement doit appartenir au visiteur.
    const payment = user
      ? await queryOne('select 1 from payments where provider_token = $1 and user_id = $2', [
          token,
          user.id,
        ])
      : null;
    if (payment) {
      try {
        outcome = await syncPaymentFromProvider(token);
      } catch {
        outcome = 'pending';
      }
    }
  }

  const message = MESSAGES[outcome];

  return (
    <div>
      <PageHeader eyebrow="Wallet" title={message.title} description={message.text} />
      <Link href="/dashboard/wallet" className="btn btn-primary">
        Retour au wallet
      </Link>
    </div>
  );
}
