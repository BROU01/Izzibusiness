const stats = [
  { label: 'Utilisateurs', value: '1 247', change: '+12%' },
  { label: 'Produits', value: '89', change: '+5%' },
  { label: 'Commandes', value: '342', change: '+18%' },
  { label: 'Revenus', value: '2.4M XOF', change: '+23%' },
];

const recentOrders = [
  { id: '#001', user: 'Aminata K.', amount: '15 000 XOF', status: 'Paye', date: 'Il y a 2h' },
  { id: '#002', user: 'Moussa T.', amount: '25 000 XOF', status: 'En attente', date: 'Il y a 5h' },
  { id: '#003', user: 'Sophie D.', amount: '9 900 XOF', status: 'Paye', date: 'Il y a 1j' },
  { id: '#004', user: 'Jean P.', amount: '19 900 XOF', status: 'Paye', date: 'Il y a 2j' },
];

export default function AdminDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Vue d&apos;ensemble de votre plateforme
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {stat.change}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '2px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Commandes recentes</h2>
          <a href="/admin/orders" style={{ fontSize: '13px', color: 'var(--accent)' }}>
            Voir tout
          </a>
        </div>

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
                ID
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
                Montant
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
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600 }}>{order.id}</td>
                <td style={{ padding: '12px 0', fontSize: '13px' }}>{order.user}</td>
                <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600 }}>
                  {order.amount}
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: order.status === 'Paye' ? '#dcfce7' : '#fef3c7',
                      color: order.status === 'Paye' ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
