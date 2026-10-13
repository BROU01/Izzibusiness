'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Vue d’ensemble' },
  { href: '/admin/users', label: 'Comptes' },
  { href: '/admin/products', label: 'Produits' },
  { href: '/admin/orders', label: 'Commandes' },
  { href: '/admin/settings', label: 'Paramètres' },
];

/** Gabarit admin. L'accès (session + rôle admin) est vérifié par src/proxy.ts. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b-3 border-ink bg-ink text-paper md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r-3">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-lg font-black uppercase">
            Izzibusiness
          </Link>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-paper/70">
            Administration
          </p>
        </div>
        <nav
          aria-label="Navigation admin"
          className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                  active ? 'bg-acid text-ink' : 'text-paper hover:bg-paper/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="whitespace-nowrap px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-paper/70 hover:text-paper md:mt-6"
          >
            Retour à mon espace
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
