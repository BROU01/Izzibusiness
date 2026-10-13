'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { signOut, useSession } from '@/hooks/useSession';

const navItems = [
  { href: '/dashboard', label: 'Vue d’ensemble' },
  { href: '/dashboard/wallet', label: 'Wallet' },
  { href: '/dashboard/orders', label: 'Commandes' },
  { href: '/dashboard/onboarding/calendar', label: 'Programme 20 jours' },
  { href: '/formations', label: 'Formations' },
  { href: '/dashboard/missions', label: 'Missions' },
  { href: '/dashboard/games', label: 'Mes parties' },
  { href: '/dashboard/referrals', label: 'Parrainage' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/profile', label: 'Profil' },
  { href: '/dashboard/settings', label: 'Paramètres' },
];

/**
 * Gabarit de l'espace membre. L'accès est filtré par src/proxy.ts (session
 * serveur) ; ici la session ne sert qu'à afficher le pseudo.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useSession();
  const username = session.user?.username ?? null;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  async function handleSignOut() {
    await signOut();
    // replace : pas de retour arrière vers une page protégée.
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="min-h-dvh md:flex">
      <div className="flex items-center justify-between border-b-3 border-ink bg-paper px-4 py-3 md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-display font-black uppercase"
        >
          <Logo size={32} />
          Izzibusiness
        </Link>
        <button
          type="button"
          className="btn btn-ghost px-3 py-2"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="dashboard-sidebar"
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r-3 border-ink bg-ink text-paper transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-display font-black uppercase"
          >
            <Logo size={32} />
            Izzibusiness
          </Link>
          <button
            type="button"
            className="font-mono text-xs font-bold uppercase tracking-wider underline md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            Fermer
          </button>
        </div>

        <div className="mx-5 mb-5 border-2 border-paper/30 px-3 py-3">
          <p className="font-semibold">{username ? `@${username}` : 'Chargement…'}</p>
          <p className="font-mono text-xs uppercase tracking-wider text-paper/70">
            {session.user?.isMember ? 'Adhérent' : 'Adhésion non réglée'}
          </p>
        </div>

        <nav aria-label="Navigation de l’espace membre" className="flex flex-col px-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                  active ? 'bg-acid text-ink' : 'text-paper hover:bg-paper/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex flex-col border-t-2 border-paper/30 px-3 py-4">
          {session.user?.role === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-paper hover:bg-paper/10"
            >
              Administration
            </Link>
          )}
          <Link
            href="/"
            className="px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-paper/70 hover:text-paper"
          >
            Retour au site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider text-paper/70 hover:text-paper"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-paper px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
