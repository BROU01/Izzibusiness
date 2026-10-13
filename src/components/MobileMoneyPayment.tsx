'use client';

import { useState, useEffect } from 'react';

interface MobileMoneyPaymentProps {
  amount: string;
  currency?: string;
  productName: string;
  onSuccess: (depositId: string) => void;
  onError: (error: string) => void;
}

const paymentMethods = [
  { id: 'orange', name: 'Orange Money', color: '#FF6600' },
  { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00' },
  { id: 'wave', name: 'Wave', color: '#00D4FF' },
  { id: 'moov', name: 'Moov Money', color: '#0066CC' },
];

const providers = [
  {
    id: 'kkiapay',
    name: 'Kkiapay',
    description: "Mobile Money Afrique de l'Ouest",
    countries: 'BJ, CI, TG, SN, NE',

    requiresCard: false,
    fees: '~2.5%',
  },
  {
    id: 'pawapay',
    name: 'PawaPay',
    description: "Mobile Money toute l'Afrique",
    countries: '20+ pays',

    requiresCard: false,
    fees: '1% + frais MMO',
  },
];

type Step = 'provider' | 'select' | 'phone' | 'confirm' | 'processing' | 'success';

/** Interface du widget Kkiapay injecté par cdn.kkiapay.me/k.js. */
interface KkiapayWindow {
  openKkiapayWidget?: (config: Record<string, unknown>) => void;
  addSuccessListener?: (listener: (response: unknown) => void) => void;
  addFailureListener?: (listener: (response: unknown) => void) => void;
}

export default function MobileMoneyPayment({
  amount,
  currency = 'XOF',
  productName,
  onSuccess,
  onError,
}: MobileMoneyPaymentProps) {
  const [step, setStep] = useState<Step>('provider');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Charger le script Kkiapay si nécessaire
  useEffect(() => {
    if (selectedProvider === 'kkiapay' && typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src="https://cdn.kkiapay.me/k.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.kkiapay.me/k.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [selectedProvider]);

  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep('select');
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (!phone || phone.length < 8) {
      setError('Numéro de téléphone invalide');
      return;
    }
    setError('');
    setStep('confirm');
  };

  // Paiement via Kkiapay (widget intégré)
  const handleKkiapayPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Obtenir la config du paiement depuis notre API
      const response = await fetch('/api/payment/kkiapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          currency,
          paymentMethod: selectedMethod,
          productName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setStep('confirm');
        setError(data.message || 'Erreur lors de la préparation du paiement');
        onError(data.message);
        setLoading(false);
        return;
      }

      setTransactionId(data.transactionId);

      // 2. Ouvrir le widget Kkiapay
      const kkiapay = (typeof window !== 'undefined' ? window : {}) as unknown as KkiapayWindow;
      if (kkiapay.openKkiapayWidget) {
        const widgetConfig = {
          amount: Number(amount),
          key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '',
          phone: phone.replace(/\s+/g, '').replace(/^\+/, ''),
          paymentmethod: 'momo',
          sandbox: process.env.NODE_ENV !== 'production',
          callback: `${window.location.origin}/api/payment/kkiapay/callback`,
          position: 'center' as const,
          theme: '#6366f1',
        };

        // Ouvrir le widget
        kkiapay.openKkiapayWidget(widgetConfig);

        // Écouter le succès
        kkiapay.addSuccessListener?.((response: unknown) => {
          console.log('Kkiapay success:', response);
          setStep('success');
          onSuccess(
            (response as { transactionId?: string } | null)?.transactionId || transactionId,
          );
        });

        // Écouter l'échec
        kkiapay.addFailureListener?.((response: unknown) => {
          console.log('Kkiapay failure:', response);
          setStep('confirm');
          setError('Le paiement a échoué. Réessayez.');
          onError('Paiement échoué');
        });
      } else {
        // Fallback: rediriger vers Kkiapay
        window.open(`https://widget.kkiapay.me/${data.transactionId}`, '_blank');
        setStep('success');
        onSuccess(data.transactionId);
      }
    } catch {
      setStep('confirm');
      setError('Erreur de connexion');
      onError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Paiement via PawaPay (existant)
  const handlePawaPayPayment = async () => {
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const response = await fetch('/api/payment/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          currency,
          paymentMethod: selectedMethod,
          productName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        onSuccess(data.depositId);
      } else {
        setStep('confirm');
        setError(data.message || 'Erreur lors du paiement');
        onError(data.message);
      }
    } catch {
      setStep('confirm');
      setError('Erreur de connexion');
      onError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedProvider === 'kkiapay') {
      handleKkiapayPayment();
    } else {
      handlePawaPayPayment();
    }
  };

  // Étape 0 : Sélection du provider
  if (step === 'provider') {
    return (
      <div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>
          Choisissez votre moyen de paiement
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Sélectionnez un fournisseur de paiement
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSelectProvider(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {provider.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{provider.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {provider.description} • {provider.fees}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Pays: {provider.countries}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Étape 1 : Sélection du moyen de paiement
  if (step === 'select') {
    return (
      <div>
        <button
          onClick={() => setStep('provider')}
          className="btn btn-ghost"
          style={{ marginBottom: '16px', padding: '0', fontSize: '13px' }}
        >
          ← Retour
        </button>

        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
          {providers.find((p) => p.id === selectedProvider)?.name}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Choisissez votre opérateur
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelectMethod(method.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: method.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{method.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Étape 2 : Saisie du numéro
  if (step === 'phone') {
    return (
      <div>
        <button
          onClick={() => setStep('select')}
          className="btn btn-ghost"
          style={{ marginBottom: '16px', padding: '0', fontSize: '13px' }}
        >
          ← Retour
        </button>

        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
          {paymentMethods.find((m) => m.id === selectedMethod)?.name}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Entrez votre numéro de téléphone
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Numéro de téléphone
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                type="tel"
                placeholder="+228 9X XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {error && (
            <div
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

          <button onClick={handlePhoneSubmit} className="btn btn-primary" style={{ width: '100%' }}>
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // Étape 3 : Confirmation
  if (step === 'confirm') {
    const method = paymentMethods.find((m) => m.id === selectedMethod);
    const provider = providers.find((p) => p.id === selectedProvider);

    return (
      <div>
        <button
          onClick={() => setStep('phone')}
          className="btn btn-ghost"
          style={{ marginBottom: '16px', padding: '0', fontSize: '13px' }}
        >
          ← Retour
        </button>

        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Confirmer le paiement</h3>

        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Produit</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{productName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Fournisseur</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{provider?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Moyen</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{method?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Téléphone</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{phone}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border)',
              paddingTop: '8px',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
              {amount} {currency}
            </span>
          </div>
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
          onClick={handlePayment}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Paiement en cours...' : 'Payer maintenant'}
        </button>
      </div>
    );
  }

  // Étape 4 : Traitement
  if (step === 'processing') {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
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
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Paiement en cours...</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Confirmez sur votre téléphone
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Étape 5 : Succès
  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--success)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          &#10003;
        </div>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Paiement réussi !</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Votre paiement de {amount} {currency} a été traité avec succès
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Continuer
        </button>
      </div>
    );
  }

  return null;
}
