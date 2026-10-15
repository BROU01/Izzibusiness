'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: 'Utilisateur Izzibusiness',
    email: 'user@izzibusiness.com',
    phone: '+228 90 12 34 56',
    bio: "Membre actif d'Izzibusiness",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Mon Profil</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
            }}
          >
            U
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
              {formData.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formData.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className="badge">Membre</span>
              <span className="badge" style={{ background: '#d6f5e8', color: 'var(--success)' }}>
                Vérifié
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '16px',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>25 000</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FCFA wallet</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>12</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Missions</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>3</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Parrainés</div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Modifier le profil
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Nom complet
            </label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Email
            </label>
            <input
              className="input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Téléphone
            </label>
            <input
              className="input"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
            >
              Bio
            </label>
            <textarea
              className="input"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          {saved && (
            <div
              style={{
                padding: '10px 12px',
                background: '#d6f5e8',
                color: 'var(--success)',
                fontSize: '13px',
              }}
            >
              Profil enregistré.
            </div>
          )}

          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
          >
            Sauvegarder les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
