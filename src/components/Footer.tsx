import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-inverse)',
        padding: '60px 0 30px',
      }}
    >
      <div className="container">
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                fontSize: '18px',
                marginBottom: '12px',
              }}
            >
              <Logo size={28} />
              Izzibusiness
            </div>
            <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: '1.6' }}>
              La plateforme tout-en-un pour gagner de l&apos;argent en ligne : formations,
              marketplace, affiliation et jeux.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/market" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Marketplace
              </Link>
              <Link href="/formations" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Formations
              </Link>
              <Link href="/games" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Jeux &amp; Gains
              </Link>
              <Link href="/leaderboard" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Classement
              </Link>
            </div>
          </div>

          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Entreprise
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/about" style={{ fontSize: '13px', color: '#a8a29e' }}>
                À propos
              </Link>
              <Link href="/contact" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Contact
              </Link>
              <Link href="/register" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Devenir membre
              </Link>
            </div>
          </div>

          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Légal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/privacy" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Confidentialité
              </Link>
              <Link href="/terms" style={{ fontSize: '13px', color: '#a8a29e' }}>
                Conditions d&apos;utilisation
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: '1px solid #292524',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#78716c',
          }}
        >
          <p>&copy; {new Date().getFullYear()} Izzibusiness. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a
              href="https://twitter.com"
              rel="noopener noreferrer nofollow"
              style={{ color: '#78716c' }}
            >
              Twitter
            </a>
            <a
              href="https://instagram.com"
              rel="noopener noreferrer nofollow"
              style={{ color: '#78716c' }}
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
