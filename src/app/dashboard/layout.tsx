'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { clearDemoPhone, getDemoPhone } from '@/lib/demo-client';

/**
 * Garde d'entrée du dashboard.
 *
 * - Mode démo : une session = un téléphone en localStorage (demo-client).
 *   Sans téléphone, redirection vers /register avec retour ici après connexion.
 * - Mode Supabase (production) : la garde autorise le rendu ; la protection
 *   réelle repose sur RLS côté données, et le middleware Supabase reste le
 *   point d'intégration pour une garde serveur quand les sessions seront actives.
 */
function useDashboardGuard(): boolean {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // getDemoPhone lit localStorage : uniquement côté client (après montage).
    // Lecture asynchrone (microtask) pour éviter un setState synchrone dans
    // l'effet, qui déclencherait un rendu en cascade (règle lint du projet).
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const phone = getDemoPhone();
      if (!phone) {
        router.replace('/register?redirect=/dashboard');
        return;
      }
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return checked;
}

const navItems = [
  { href: '/dashboard', label: "Vue d'ensemble" },
  { href: '/dashboard/onboarding/calendar', label: 'Programme 20 jours' },
  { href: '/dashboard/wallet', label: 'Mon Wallet' },
  { href: '/formations', label: 'Formations' },
  { href: '/dashboard/orders', label: 'Mes Commandes' },
  { href: '/dashboard/games', label: 'Mes Jeux' },
  { href: '/dashboard/missions', label: 'Missions' },
  { href: '/dashboard/referrals', label: 'Affiliation' },
  { href: '/dashboard/streaming', label: 'Streaming' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/profile', label: 'Mon Profil' },
  { href: '/dashboard/settings', label: 'Paramètres' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Garde : tant que la session démo n'est pas confirmée, rien ne se rend
  // (ni appels API, ni contenu) — écran de chargement minimal.
  const authChecked = useDashboardGuard();

  // Escape ferme le drawer mobile.
  useEffect(() => {
    if (!authChecked || !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, authChecked]);

  // Les liens de navigation ferment le drawer (onClick).

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'var(--paper)',
          color: 'var(--ink)',
        }}
        role="status"
        aria-live="polite"
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Vérification de ta session…
        </p>
        <a href="/register" className="btn btn-ghost" style={{ fontSize: '12px' }}>
          Pas encore de compte ? S&apos;inscrire
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Bouton menu mobile */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setMenuOpen(true)}
        aria-label="Ouvrir le menu du tableau de bord"
        aria-controls="dashboard-sidebar"
      >
        ☰ Menu
      </button>

      {/* Overlay mobile */}
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}
        style={{
          width: '240px',
          background: 'var(--bg-dark)',
          color: 'var(--text-inverse)',
          padding: '24px 0',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0 20px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
            }}
          >
            <Logo size={32} />
            <span style={{ fontWeight: 800, fontSize: '16px' }}>Izzibusiness</span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#a8a29e',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            margin: '0 20px 24px',
            padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
              }}
              aria-hidden="true"
            >
              U
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Utilisateur</div>
              <div style={{ fontSize: '11px', color: '#78716c' }}>Membre Izzibusiness</div>
            </div>
          </div>
        </div>

        <nav
          aria-label="Navigation du tableau de bord"
          style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'white' : '#a8a29e',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: '24px', padding: '0 12px' }}>
          <button
            type="button"
            onClick={() => {
              clearDemoPhone();
              // router.replace : évite un retour arrière vers la session fermée
              // et recharge les données côté client.
              router.replace('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: '#78716c',
              background: 'none',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Se déconnecter
          </button>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: '#78716c',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
            }}
          >
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="dashboard-main"
        style={{ flex: 1, background: 'var(--bg-secondary)', padding: '32px' }}
      >
        {children}
      </main>

      <style>{`
        /* Empêche les flex items de dépasser le viewport (min-width auto par défaut). */
        .dashboard-main { min-width: 0; }
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed !important;
            left: -260px;
            top: 0;
            z-index: 200;
            transition: left 0.2s ease;
          }
          .dashboard-sidebar.open {
            left: 0;
          }
          .sidebar-toggle {
            display: block !important;
          }
          .sidebar-close {
            display: block !important;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 150;
          }
          .dashboard-main {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
