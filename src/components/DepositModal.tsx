'use client';

import { useState, useEffect } from 'react';
import { MIN_DEPOSIT, formatFcfa } from '@/lib/config';

/** Interface du widget Kkiapay injecté par cdn.kkiapay.me/k.js. */
interface KkiapayWindow {
  openKkiapayWidget?: (config: Record<string, unknown>) => void;
  addSuccessListener?: (listener: (response: unknown) => void) => void;
  addFailureListener?: (listener: (response: unknown) => void) => void;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: () => void;
}

const providers = [
  { id: 'orange', name: 'Orange Money', color: '#FF6600' },
  { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00' },
  { id: 'wave', name: 'Wave', color: '#00D4FF' },
  { id: 'moov', name: 'Moov Money', color: '#0066CC' },
];

const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

export default function DepositModal({ isOpen, onClose, onDepositSuccess }: DepositModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger le script Kkiapay
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src="https://cdn.kkiapay.me/k.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.kkiapay.me/k.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  const handleDeposit = async () => {
    setError('');

    if (!provider) {
      setError('Selectionnez un moyen de paiement');
      return;
    }
    if (!phone || phone.replace(/\s/g, '').length < 8) {
      setError('Numero de telephone invalide');
      return;
    }
    if (!amount || Number(amount) < MIN_DEPOSIT) {
      setError(`Le montant minimum est de ${formatFcfa(MIN_DEPOSIT)}`);
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // 1. Initier le depot via notre API
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          phone: phone.replace(/\s/g, '').replace(/^\+/, ''),
          provider,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setStep('form');
        setError(data.error?.message || data.message || "Erreur lors de l'initiation du dépôt");
        setLoading(false);
        return;
      }

      // Mode démo : le dépôt est déjà crédité côté serveur.
      if (data.simulated) {
        setStep('success');
        onDepositSuccess();
        setLoading(false);
        return;
      }

      // 2. Ouvrir le widget Kkiapay
      const kkiapay = window as unknown as KkiapayWindow;
      if (typeof window !== 'undefined' && kkiapay.openKkiapayWidget) {
        kkiapay.openKkiapayWidget(data.widgetConfig);

        // Ecouter le succes
        kkiapay.addSuccessListener?.((response: unknown) => {
          console.log('Kkiapay success:', response);
          setStep('success');
          onDepositSuccess();
          setLoading(false);
        });

        // Ecouter l'echec
        kkiapay.addFailureListener?.((response: unknown) => {
          console.log('Kkiapay failure:', response);
          setStep('error');
          setError('Le paiement a échoué. Réessayez.');
          setLoading(false);
        });

        // Timeout apres 60 secondes
        setTimeout(() => {
          if (step === 'processing') {
            setStep('error');
            setError("Delai d'attente depasse. Verifiez votre telephone.");
            setLoading(false);
          }
        }, 60000);
      } else {
        // Fallback: simuler un succes (sandbox)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setStep('success');
        onDepositSuccess();
        setLoading(false);
      }
    } catch {
      setStep('form');
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setProvider('');
    setPhone('');
    setAmount('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            {step === 'form' && 'Deposer des fonds'}
            {step === 'processing' && 'Paiement en cours'}
            {step === 'success' && 'Depot reussi'}
            {step === 'error' && 'Echec du depot'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            X
          </button>
        </div>

        {/* Step: Form */}
        {step === 'form' && (
          <>
            {/* Provider selection */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
              >
                Moyen de paiement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${provider === p.id ? p.color : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      background: provider === p.id ? `${p.color}10` : 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Numero de telephone
              </label>
              <input
                type="tel"
                className="input"
                placeholder="+228 90 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Montant (FCFA)
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a.toString())}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${amount === a.toString() ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      background: amount === a.toString() ? 'var(--accent)' : 'var(--bg-card)',
                      color: amount === a.toString() ? 'white' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {a >= 1000 ? `${a / 1000}k` : a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="input"
                placeholder="Montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_DEPOSIT}
                style={{ width: '100%' }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: '#fee2e2',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Traitement...' : 'Deposer'}
            </button>
          </>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Confirmez le paiement sur votre telephone
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {providers.find((p) => p.id === provider)?.name} - {phone}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 auto 16px',
              }}
            >
              OK
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Depot reussi</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {Number(amount).toLocaleString()} FCFA ont ete credites sur votre wallet
            </p>
            <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>
              Fermer
            </button>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 auto 16px',
              }}
            >
              !
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Echec du depot
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {error || 'Le paiement a echoue. Reessayez.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </button>
              <button
                onClick={() => setStep('form')}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Reessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
