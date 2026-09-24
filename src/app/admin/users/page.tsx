const users = [
  {
    id: 1,
    name: 'Aminata Koné',
    email: 'aminata@email.com',
    role: 'Vendeur',
    status: 'Actif',
    joined: '15 Jan 2026',
  },
  {
    id: 2,
    name: 'Moussa Traoré',
    email: 'moussa@email.com',
    role: 'Affilié',
    status: 'Actif',
    joined: '22 Jan 2026',
  },
  {
    id: 3,
    name: 'Sophie Diallo',
    email: 'sophie@email.com',
    role: 'Client',
    status: 'Actif',
    joined: '30 Jan 2026',
  },
  {
    id: 4,
    name: 'Jean Potier',
    email: 'jean@email.com',
    role: 'Vendeur',
    status: 'Suspendu',
    joined: '05 Fév 2026',
  },
  {
    id: 5,
    name: 'Fatou Camara',
    email: 'fatou@email.com',
    role: 'Client',
    status: 'Actif',
    joined: '12 Fév 2026',
  },
];

export default function AdminUsers() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Utilisateurs</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Gérez les comptes utilisateurs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="input" placeholder="Rechercher..." style={{ width: '200px' }} />
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Utilisateur
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Rôle
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Statut
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Inscrit le
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
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
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span className="badge">{user.role}</span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: user.status === 'Actif' ? '#dcfce7' : '#fee2e2',
                      color: user.status === 'Actif' ? 'var(--success)' : 'var(--error)',
                    }}
                  >
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {user.joined}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right' }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--accent)',
                    }}
                  >
                    Gérer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
