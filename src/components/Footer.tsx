import Link from 'next/link';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Plateforme',
    links: [
      { href: '/market', label: 'Marché' },
      { href: '/formations', label: 'Formations' },
      { href: '/games', label: 'Jeux' },
    ],
  },
  {
    title: 'Izzibusiness',
    links: [
      { href: '/about', label: 'À propos' },
      { href: '/contact', label: 'Contact' },
      { href: '/register', label: 'Créer un compte' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '/privacy', label: 'Confidentialité' },
      { href: '/terms', label: 'Conditions d’utilisation' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t-3 border-ink bg-ink text-paper">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-black uppercase">
            <Logo size={28} />
            Izzibusiness
          </p>
          <p className="mt-3 max-w-xs text-sm text-paper/75">
            Marché, formations et wallet Mobile Money pour les membres d’Afrique de l’Ouest.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-paper/75">
              {col.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t-2 border-paper/20">
        <p className="container py-5 font-mono text-xs uppercase tracking-wider text-paper/75">
          © {new Date().getFullYear()} Izzibusiness
        </p>
      </div>
    </footer>
  );
}
