'use client';

import { useState } from 'react';

const streamingServices = [
  {
    id: 'flemmix',
    name: 'FlemMix',
    description: 'Films, series et mangas en streaming',
    category: 'Films & Series',
    features: ['Films populaires', 'Series TV', 'Mangas'],
  },
  {
    id: 'xalaflix',
    name: 'XalaFlix',
    description: 'Series et films en VF et VOSTFR',
    category: 'Films & Series',
    content: 'VF et VOSTFR',
    features: ['Dernieres sorties', 'Séries exclusives', 'Documentaires'],
  },
  {
    id: 'chillenzie',
    name: 'Chillenzie',
    description: 'Animes et mangas en streaming',
    category: 'Animes',
    features: ['Animes sub', 'Mangas', 'OAVs'],
  },
];

export default function StreamingPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleAccess = (service: (typeof streamingServices)[0]) => {
    setSelectedService(service.id);
    // In production, this opens a server-side proxy or authenticated redirect
    // For now we open a placeholder
    window.open('#', '_blank', 'noopener,noreferrer');
    setTimeout(() => setSelectedService(null), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Streaming</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Acces aux services de streaming inclus avec votre compte
        </p>
      </div>

      <div
        style={{
          padding: '16px',
          background: 'var(--accent-light)',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--accent-hover)',
        }}
      >
        <strong>Acces inclus</strong> -- Ces services sont disponibles pour tous les membres
        Izzibusiness.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {streamingServices.map((service) => (
          <div
            key={service.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                {service.category}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                {service.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{service.description}</p>
              <ul
                style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  paddingLeft: '16px',
                }}
              >
                {service.features.map((f, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <button
                onClick={() => handleAccess(service)}
                disabled={selectedService === service.id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedService === service.id ? 'var(--success)' : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {selectedService === service.id ? 'Ouverture...' : 'Acceder'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '32px',
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Comment acceder</h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>1.</span>
            <span>Cliquez sur &laquo;&nbsp;Accéder&nbsp;&raquo; pour ouvrir le service</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>2.</span>
            <span>Le site s&apos;ouvre dans un nouvel onglet</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>3.</span>
            <span>Profitez du contenu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
