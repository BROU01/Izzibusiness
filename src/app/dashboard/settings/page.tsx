'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    language: 'fr',
    theme: 'light',
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Paramètres</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Configurez votre compte et vos préférences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Notifications */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Notifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Notifications push</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Recevez des alertes sur votre appareil
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Alertes email</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Recevez les mises à jour par email
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Alertes SMS</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Recevez les alertes par SMS
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Préférences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Langue
              </label>
              <select
                className="input"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Thème
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'light', label: 'Clair' },
                  { id: 'dark', label: 'Sombre' },
                  { id: 'auto', label: 'Auto' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSettings({ ...settings, theme: theme.id })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${settings.theme === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                      background:
                        settings.theme === theme.id ? 'var(--accent-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Sécurité</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Changer le mot de passe
            </button>
            <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Activer la 2FA
            </button>
            <button
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start', color: 'var(--error)' }}
            >
              Supprimer mon compte
            </button>
          </div>
        </div>

        {/* Save */}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          Sauvegarder les paramètres
        </button>
      </div>
    </div>
  );
}
