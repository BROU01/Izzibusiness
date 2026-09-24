'use client';

import { useEffect, useState } from 'react';
import { REFERRAL_BONUS, formatFcfa } from '@/lib/config';
import { getDemoPhone } from '@/lib/demo-client';

interface DemoReferral {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'pending';
  earned: number;
  createdAt: string;
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('IZZ····');
  const [referrals, setReferrals] = useState<DemoReferral[]>([]);

  useEffect(() => {
    const phone = getDemoPhone();
    if (!phone) return;
    // Le profil démo complet (code + filleuls) est servi par l'API membership.
    fetch(`/api/membership?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.demoMode && data.referralCode) {
          setReferralCode(data.referralCode);
        }
        if (Array.isArray(data.referrals)) {
          setReferrals(data.referrals);
        }
      })
      .catch(() => {});
  }, []);

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `/register?ref=${referralCode}`;

  const totalEarned = referrals.reduce((sum, r) => sum + r.earned, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Affiliation</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Gagnez {formatFcfa(REFERRAL_BONUS)} en recommandant Izzibusiness
        </p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>
            {referrals.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Personnes parrainées</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e' }}>
            {formatFcfa(totalEarned)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total gagné</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {formatFcfa(REFERRAL_BONUS)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Par parrainage actif</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          Votre lien de parrainage
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Partagez ce lien avec vos amis. Vous gagnez {formatFcfa(REFERRAL_BONUS)} pour chaque
          inscription qui complète son adhésion !
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            className="input"
            value={referralLink}
            readOnly
            aria-label="Lien de parrainage"
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button
            onClick={() => copyToClipboard(referralLink)}
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
          >
            {copied ? 'Copié ✓' : 'Copier'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Code de parrainage
            </div>
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '2px',
              }}
            >
              {referralCode}
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => copyToClipboard(`Rejoins Izzibusiness avec mon lien : ${referralLink}`)}
            style={{
              flex: 1,
              padding: '10px',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Partager sur WhatsApp
          </button>
          <button
            onClick={() => copyToClipboard(`Rejoins Izzibusiness : ${referralLink}`)}
            style={{
              flex: 1,
              padding: '10px',
              background: '#1877F2',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Partager sur Facebook
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Comment ça marche
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              step: 1,
              title: 'Partagez votre lien',
              desc: 'Envoyez votre lien de parrainage à vos amis',
            },
            {
              step: 2,
              title: "Ils s'inscrivent et adhèrent",
              desc: `Vos amis créent un compte et paient l'adhésion de ${formatFcfa(4000)}`,
            },
            {
              step: 3,
              title: 'Vous gagnez !',
              desc: `${formatFcfa(REFERRAL_BONUS)} crédités sur votre wallet pour chaque filleul actif`,
            },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Mes parrainages</h2>

        {referrals.length === 0 ? (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '24px 0',
            }}
          >
            Aucun filleul pour l&apos;instant. Partagez votre lien pour commencer à gagner.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {referrals.map((ref) => (
              <div
                key={ref.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  {ref.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{ref.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(ref.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: ref.status === 'active' ? '#dcfce7' : '#fef3c7',
                      color: ref.status === 'active' ? 'var(--success)' : 'var(--warning)',
                      fontWeight: 600,
                    }}
                  >
                    {ref.status === 'active' ? 'Actif' : 'En attente'}
                  </div>
                  {ref.earned > 0 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#22c55e',
                        fontWeight: 600,
                        marginTop: '4px',
                      }}
                    >
                      +{formatFcfa(ref.earned)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
