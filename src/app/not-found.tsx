import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--ink-muted)]">Erreur 404</p>
      <h1 className="font-display text-4xl font-bold">Page introuvable</h1>
      <p className="text-[var(--ink-muted)]">
        Cette page n&apos;existe pas ou a été déplacée. Retrouvez le classement général ou vos
        missions depuis le tableau de bord.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn">
          Retour à l&apos;accueil
        </Link>
        <Link href="/leaderboard" className="btn-secondary">
          Voir le leaderboard
        </Link>
      </div>
    </main>
  );
}
