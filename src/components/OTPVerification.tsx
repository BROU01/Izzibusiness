'use client';

import { useState, useEffect } from 'react';

interface OTPVerificationProps {
  phone: string;
  onVerified: (
    verified: boolean,
    session?: { access_token: string; refresh_token: string; expires_at: number },
  ) => void;
  onBack?: () => void;
}

export default function OTPVerification({ phone, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);

  // Timer pour renvoyer le code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Renvoi manuel du code (bouton)
  const sendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setResendTimer(60);
      } else {
        setError(data.message || "Erreur lors de l'envoi du code");
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Envoyer le code OTP automatiquement au montage — le setState de
  // sendOTP s'exécute après la réponse réseau, pas de façon synchrone.
  useEffect(() => {
    let cancelled = false;
    if (phone) {
      void (async () => {
        try {
          const response = await fetch('/api/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          const data = await response.json();
          if (cancelled) return;
          if (data.success) {
            setOtpSent(true);
            setResendTimer(60);
          } else {
            setError(data.message || "Erreur lors de l'envoi du code");
          }
        } catch {
          if (!cancelled) setError('Erreur de connexion');
        }
      })();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vérifier le code OTP
  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        onVerified(true, data.session);
      } else {
        setError(data.message || 'Code invalide');
        setOtp(['', '', '', '', '', '']);
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la saisie du code
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[name="otp-${index + 1}"]`,
      ) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    // Vérifier automatiquement quand tous les chiffres sont saisis
    if (newOtp.every((digit) => digit !== '')) {
      verifyOTP();
    }
  };

  // Gérer le backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[name="otp-${index - 1}"]`,
      ) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  if (success) {
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
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Vérifié !</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Votre numéro a été vérifié avec succès
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Vérification SMS</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {otpSent ? `Un code a été envoyé au ${phone}` : 'Envoi du code en cours...'}
        </p>
      </div>

      {/* Input OTP */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {otp.map((digit, index) => (
          <input
            key={index}
            name={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            style={{
              width: '48px',
              height: '56px',
              textAlign: 'center',
              fontSize: '20px',
              fontWeight: 700,
              border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: '#fee2e2',
            color: 'var(--error)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={verifyOTP}
          disabled={loading || otp.some((d) => !d)}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Vérification...' : 'Vérifier le code'}
        </button>

        <button
          onClick={sendOTP}
          disabled={resendTimer > 0 || loading}
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: '13px' }}
        >
          {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-ghost"
            style={{ width: '100%', fontSize: '13px' }}
          >
            ← Retour
          </button>
        )}
      </div>
    </div>
  );
}
