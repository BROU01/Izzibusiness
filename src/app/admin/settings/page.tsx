export default function AdminSettings() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Paramètres</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configurez votre plateforme</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* General */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Général</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Nom de la plateforme
              </label>
              <input className="input" defaultValue="Izzibusiness" />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Description
              </label>
              <textarea
                className="input"
                rows={3}
                defaultValue="Plateforme moderne pour gérer vos services et produits"
              />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Payments */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Paiements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
              >
                Mobile Money
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Orange Money', 'MTN MoMo', 'Wave'].map((provider) => (
                  <label
                    key={provider}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <input type="checkbox" defaultChecked />
                    {provider}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Sécurité</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input type="checkbox" defaultChecked />
              Authentification par code PIN obligatoire
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input type="checkbox" defaultChecked />
              Activer l&apos;authentification biométrique
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input type="checkbox" />
              Double authentification (2FA)
            </label>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
