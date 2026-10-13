'use client';

import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { useSession } from '@/hooks/useSession';
import { useWallet } from '@/hooks/useWallet';
import { ADHESION_FEE, REFERRAL_BONUS, formatFcfa } from '@/lib/config';

export default function DashboardPage() {
  const session = useSession();
  const { balance, gameBalance, loading, error } = useWallet();
  const username = session.user?.username;
  const isMember = session.user?.isMember === true;

  const amount = (value: number) => (loading ? 'Chargement…' : formatFcfa(value));

  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title={username ? `Bonjour @${username}` : 'Bonjour'}
        description="Ton solde, ton adhésion et ton parrainage en un coup d’œil."
        action={
          <Link href="/dashboard/wallet" className="btn btn-primary">
            Ouvrir mon wallet
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mb-6 border-3 border-ink bg-[#ffe1d6] px-4 py-3 font-semibold">
          {error}
        </p>
      )}

      <dl className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card-flat">
          <dt className="eyebrow">Solde principal</dt>
          <dd className="mt-2 font-display text-3xl font-black">{amount(balance)}</dd>
        </div>
        <div className="card-flat">
          <dt className="eyebrow">Solde jeux</dt>
          <dd className="mt-2 font-display text-3xl font-black">{amount(gameBalance)}</dd>
        </div>
        <div className="card-flat">
          <dt className="eyebrow">Adhésion</dt>
          <dd className="mt-2 font-display text-3xl font-black">
            {session.status === 'loading' ? 'Chargement…' : isMember ? 'Active' : 'Non réglée'}
          </dd>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        {!isMember && session.status === 'authenticated' && (
          <section className="card">
            <p className="eyebrow">À faire</p>
            <h2 className="mt-2 text-2xl">Régler ton adhésion</h2>
            <p className="mt-2 text-ink-70">
              {formatFcfa(ADHESION_FEE)}, une seule fois. Le paiement Mobile Money par PayDunya
              ouvre très bientôt ; tu seras prévenu dans tes notifications.
            </p>
          </section>
        )}

        <section className="card">
          <p className="eyebrow">Parrainage</p>
          <h2 className="mt-2 text-2xl">Invite tes proches</h2>
          <p className="mt-2 text-ink-70">
            Tu reçois {formatFcfa(REFERRAL_BONUS)} pour chaque filleul qui règle son adhésion.
          </p>
          <Link
            href="/dashboard/referrals"
            className="mt-4 inline-block font-bold underline underline-offset-4"
          >
            Voir mon lien d’invitation
          </Link>
        </section>

        <section className="card">
          <p className="eyebrow">Programme</p>
          <h2 className="mt-2 text-2xl">20 jours pour démarrer</h2>
          <p className="mt-2 text-ink-70">Une leçon et une action concrète par jour.</p>
          <Link
            href="/dashboard/onboarding/calendar"
            className="mt-4 inline-block font-bold underline underline-offset-4"
          >
            Reprendre le programme
          </Link>
        </section>
      </div>
    </div>
  );
}
