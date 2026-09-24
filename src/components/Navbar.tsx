'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/formations', label: 'Formation' },
  { href: '/dashboard/missions', label: 'Missions' },
  { href: '/games', label: 'Jeux' },
  { href: '/market', label: 'Marketplace' },
  { href: '/dashboard/referrals', label: 'Affiliation' },
  { href: '/leaderboard', label: 'Classement' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  return (
    <nav className="border-b-3 border-ink bg-paper sticky top-0 z-50 shadow-hard">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-lg md:text-xl font-black uppercase tracking-tight hover:text-flame transition-colors"
        >
          Izzibusiness
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[13px] uppercase tracking-wider px-3 py-2 border-3 transition-colors ${
                isActive(item.href)
                  ? 'border-ink bg-acid text-ink font-bold'
                  : 'border-transparent hover:border-ink hover:bg-acid hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/login"
            className="btn btn-secondary"
            aria-current={isActive('/login') ? 'page' : undefined}
          >
            Connexion
          </Link>
          <Link href="/register" className="btn btn-primary">
            Commencer
          </Link>
        </div>

        <button
          type="button"
          className="btn btn-primary lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? '[ X ]' : '[ MENU ]'}
        </button>
      </div>

      {isOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t-3 border-ink bg-paper px-4 md:px-8 py-4 flex flex-col gap-2"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`font-mono text-sm uppercase tracking-wider px-3 py-3 border-3 transition-colors ${
                isActive(item.href)
                  ? 'border-ink bg-acid text-ink font-bold'
                  : 'border-ink hover:bg-acid'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t-3 border-ink mt-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="btn btn-secondary flex-1 justify-center"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary flex-1 justify-center"
            >
              Commencer
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
