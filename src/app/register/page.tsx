'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import OTPVerification from '@/components/OTPVerification';
import Logo from '@/components/Logo';
import { setDemoPhone } from '@/lib/demo-client';
import { ADHESION_FEE, formatFcfa } from '@/lib/config';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') ?? '';

  // Destination après inscription : le paramètre ?redirect= posé par les
  // gardes (dashboard, formations). Restreint aux chemins internes commençant
  // par "/" (pas de "//" ni de scheme externe) pour bloquer les open redirects.
  const rawRedirect = searchParams.get('redirect') ?? '';
  const redirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Veuillez indiquer votre nom complet');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Veuillez indiquer un numéro de téléphone valide');
      return;
    }

    setStep('otp');
  };

  const handleOTPVerified = async (verified: boolean) => {
    if (!verified) return;
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, referralCode: referralCode || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        // Mode démo : le téléphone devient l'identifiant de session.
        setDemoPhone(phone.replace(/\s+/g, ''));
        // Reviens à la page d'origine (dashboard, formations…) ou au dashboard.
        router.push(redirectPath);
      } else {
        setError(data.message || 'Erreur lors de la création du compte');
        setStep('form');
      }
    } catch {
      setError('Erreur de connexion. Réessayez.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: '24px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
            aria-label="Retour à l'accueil Izzibusiness"
          >
            <Logo size={48} />
          </Link>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Inscription</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {step === 'form' ? 'Créez votre compte en 2 minutes' : 'Vérifiez votre numéro'}
          </p>
        </div>

        {referralCode && step === 'form' && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            Code de parrainage appliqué : <strong>{referralCode}</strong>
          </p>
        )}

        {step === 'form' ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label
                htmlFor="register-name"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Nom complet
              </label>
              <input
                id="register-name"
                className="input"
                type="text"
                placeholder="Votre nom"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="register-phone"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Téléphone
              </label>
              <input
                id="register-phone"
                className="input"
                type="tel"
                placeholder="+228 9X XX XX XX"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  background: '#fee2e2',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              Après votre inscription, l&apos;
              <strong>adhésion coûte {formatFcfa(ADHESION_FEE)}</strong> (paiement Mobile Money).
              Elle débloque les jeux, les missions et les retraits (minimum {formatFcfa(5000)}).
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Création…' : 'Continuer'}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Déjà inscrit ?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Se connecter
              </Link>
            </p>
          </form>
        ) : (
          <OTPVerification
            phone={phone}
            onVerified={handleOTPVerified}
            onBack={() => setStep('form')}
          />
        )}
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
          }}
        >
          Chargement…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
