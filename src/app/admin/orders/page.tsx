const orders = [
  {
    id: '#001',
    user: 'Aminata K.',
    product: 'Formation Marketing',
    amount: '15 000 XOF',
    status: 'Payé',
    date: '30 Août 2026',
  },
  {
    id: '#002',
    user: 'Moussa T.',
    product: 'Pack E-commerce',
    amount: '25 000 XOF',
    status: 'En attente',
    date: '30 Août 2026',
  },
  {
    id: '#003',
    user: 'Sophie D.',
    product: 'Guide Affiliation',
    amount: '9 900 XOF',
    status: 'Payé',
    date: '29 Août 2026',
  },
  {
    id: '#004',
    user: 'Jean P.',
    product: 'Template Site Web',
    amount: '19 900 XOF',
    status: 'Payé',
    date: '28 Août 2026',
  },
  {
    id: '#005',
    user: 'Fatou C.',
    product: 'Cours Photoshop',
    amount: '12 000 XOF',
    status: 'Remboursé',
    date: '27 Août 2026',
  },
];

export default function AdminOrders() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Commandes</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Suivez toutes les transactions
        </p>
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
                Produit
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
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600 }}>{order.id}</td>
                <td style={{ padding: '12px 0', fontSize: '13px' }}>{order.user}</td>
                <td style={{ padding: '12px 0', fontSize: '13px' }}>{order.product}</td>
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
                      background:
                        order.status === 'Payé'
                          ? '#dcfce7'
                          : order.status === 'En attente'
                            ? '#fef3c7'
                            : '#fee2e2',
                      color:
                        order.status === 'Payé'
                          ? 'var(--success)'
                          : order.status === 'En attente'
                            ? 'var(--warning)'
                            : 'var(--error)',
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
