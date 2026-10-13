'use client';

import { useEffect, useRef, useState } from 'react';
import { MIN_WITHDRAWAL, WITHDRAWAL_FEE_RATE, formatFcfa } from '@/lib/config';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdrawSuccess: (newBalance: number) => void;
}

const providers = [
  { id: 'orange', name: 'Orange Money', color: '#FF6600' },
  { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00' },
  { id: 'wave', name: 'Wave', color: '#00D4FF' },
  { id: 'moov', name: 'Moov Money', color: '#0066CC' },
];

const quickAmounts = [5000, 10000, 25000, 50000, 100000];

export default function WithdrawModal({
  isOpen,
  onClose,
  balance,
  onWithdrawSuccess,
}: WithdrawModalProps) {
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    id: string;
    amount: number;
    fees: number;
    total: number;
  } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setStep('form');
    setProvider('');
    setPhone('');
    setAmount('');
    setError('');
    setResult(null);
    onClose();
  };

  // Focus sur le bouton fermer à l'ouverture + Escape ferme le dialog.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fees = Math.ceil(Number(amount || 0) * WITHDRAWAL_FEE_RATE);
  const total = Number(amount || 0) + fees;

  const handleNext = () => {
    setError('');

    if (!provider) {
      setError('Sélectionnez un moyen de paiement');
      return;
    }
    if (!phone || phone.replace(/\s/g, '').length < 8) {
      setError('Numéro de téléphone invalide');
      return;
    }
    if (!amount || Number(amount) < MIN_WITHDRAWAL) {
      setError(`Le montant minimum de retrait est de ${formatFcfa(MIN_WITHDRAWAL)}`);
      return;
    }
    if (total > balance) {
      setError('Solde insuffisant (montant + frais)');
      return;
    }

    setStep('confirm');
  };

  const handleWithdraw = async () => {
    setStep('processing');
    setError('');

    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          phone: phone.replace(/\s/g, '').replace(/^\+/, ''),
          provider,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.withdrawal);
        onWithdrawSuccess(data.newBalance);
        setStep('success');
      } else {
        setStep('confirm');
        setError(data.error?.message || data.message || 'Erreur lors du retrait');
      }
    } catch {
      setStep('confirm');
      setError('Erreur de connexion');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
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
          <h2 id="withdraw-modal-title" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            {step === 'form' && 'Retirer des fonds'}
            {step === 'confirm' && 'Confirmer le retrait'}
            {step === 'processing' && 'Traitement en cours'}
            {step === 'success' && 'Retrait effectué'}
          </h2>
          <button
            ref={closeRef}
            onClick={handleClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
          >
            Fermer
          </button>
        </div>

        {/* Step: Form */}
        {step === 'form' && (
          <>
            {/* Balance info */}
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solde disponible</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                {formatFcfa(balance)}
              </div>
            </div>

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
                    type="button"
                    onClick={() => setProvider(p.id)}
                    aria-pressed={provider === p.id}
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
                htmlFor="withdraw-phone"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Numéro de téléphone
              </label>
              <input
                id="withdraw-phone"
                type="tel"
                className="input"
                placeholder="+228 90 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Le numéro doit être lié à votre compte{' '}
                {provider ? providers.find((p) => p.id === provider)?.name : 'Mobile Money'}
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="withdraw-amount"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Montant (FCFA) — minimum {MIN_WITHDRAWAL.toLocaleString('fr-FR')}
              </label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a.toString())}
                    aria-pressed={amount === a.toString()}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: `1px solid ${amount === a.toString() ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      background: amount === a.toString() ? 'var(--accent)' : 'var(--bg-card)',
                      color: amount === a.toString() ? 'white' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {a >= 1000 ? `${a / 1000}k` : a}
                  </button>
                ))}
              </div>
              <input
                id="withdraw-amount"
                type="number"
                className="input"
                placeholder="Montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_WITHDRAWAL}
                style={{ width: '100%' }}
              />
            </div>

            {/* Fees preview */}
            {amount && Number(amount) >= MIN_WITHDRAWAL && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Montant</span>
                  <span>{Number(amount).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Frais (2 %)</span>
                  <span>{fees.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    borderTop: '1px solid var(--border)',
                    paddingTop: '4px',
                    marginTop: '4px',
                  }}
                >
                  <span>Total débité</span>
                  <span>{total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            )}

            {amount && Number(amount) < MIN_WITHDRAWAL && (
              <p style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '12px' }}>
                Le retrait minimum est de {formatFcfa(MIN_WITHDRAWAL)}.
              </p>
            )}

            {error && (
              <div
                role="alert"
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

            <button onClick={handleNext} className="btn btn-primary" style={{ width: '100%' }}>
              Continuer
            </button>
          </>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <>
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Opérateur</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {providers.find((p) => p.id === provider)?.name}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Téléphone</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{phone}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Montant</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {Number(amount).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Frais</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {fees.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  borderTop: '1px solid var(--border)',
                  paddingTop: '8px',
                  marginTop: '8px',
                }}
              >
                <span>Total débité</span>
                <span style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
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
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep('form')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Retour
              </button>
              <button onClick={handleWithdraw} className="btn btn-primary" style={{ flex: 1 }}>
                Confirmer le retrait
              </button>
            </div>
          </>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }} role="status">
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
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Traitement de votre retrait…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && result && (
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
              aria-hidden="true"
            >
              OK
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Retrait initié
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {result.amount.toLocaleString('fr-FR')} FCFA seront envoyés sur {phone}
            </p>
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Référence</span>
                <span style={{ fontFamily: 'monospace' }}>{result.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Délai estimé</span>
                <span>1-24 heures</span>
              </div>
            </div>
            <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
