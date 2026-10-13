import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--ink-muted)]">Erreur 404</p>
      <h1 className="font-display text-4xl font-bold">Page introuvable</h1>
      <p className="text-[var(--ink-muted)]">
        Cette page n&apos;existe pas ou a été déplacée. Le marché et ton espace restent accessibles.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn">
          Retour à l&apos;accueil
        </Link>
        <Link href="/market" className="btn-secondary">
          Parcourir le marché
        </Link>
      </div>
    </main>
  );
}
