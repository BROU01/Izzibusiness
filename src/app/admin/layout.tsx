'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Produits' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/orders', label: 'Commandes' },
  { href: '/admin/settings', label: 'Parametres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '240px',
          background: 'var(--bg-dark)',
          color: 'var(--text-inverse)',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px', marginBottom: '32px' }}>
          <Link
            href="/admin"
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
          <div style={{ fontSize: '11px', color: '#78716c', marginTop: '4px' }}>Administration</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
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

        <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px' }}>
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
            }}
          >
            Retour au site
          </Link>
        </div>
      </aside>

      <main style={{ flex: 1, background: 'var(--bg-secondary)', padding: '32px' }}>
        {children}
      </main>
    </div>
  );
}
