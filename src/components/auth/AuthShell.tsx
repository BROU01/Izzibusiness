import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  /** Rubrique mono au-dessus du titre (ex. « Accès membre »). */
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  /** Lien de sortie sous le formulaire (ex. vers l'inscription). */
  footer: ReactNode;
}

/**
 * Gabarit commun des pages d'accès : colonne éditoriale à gauche (desktop),
 * formulaire dans une carte à droite. Sur mobile, une seule colonne.
 */
export default function AuthShell({ eyebrow, title, intro, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b-3 border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="font-display text-xl font-black uppercase tracking-tight hover:text-flame"
          >
            Izzibusiness
          </Link>
          <Link
            href="/market"
            className="font-mono text-xs font-bold uppercase tracking-[0.14em] underline-offset-4 hover:underline"
          >
            Voir le marché
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
        <section className="lg:pt-6">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-[clamp(2.25rem,1.4rem+3.6vw,4rem)]">{title}</h1>
          <p className="mt-4 max-w-md text-lg text-ink-70">{intro}</p>
        </section>

        <section className="card self-start">
          {children}
          <div className="mt-6 border-t-2 border-ink pt-5 text-sm">{footer}</div>
        </section>
      </main>
    </div>
  );
}
