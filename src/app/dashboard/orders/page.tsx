'use client';

const orders = [
  {
    id: '#ORD-001',
    product: 'Formation Marketing Digital',
    amount: '15 000 FCFA',
    status: 'Livre',
    date: '28 Aout 2026',
  },
  {
    id: '#ORD-002',
    product: 'Guide Affiliation Pro',
    amount: '9 900 FCFA',
    status: 'En cours',
    date: '25 Aout 2026',
  },
  {
    id: '#ORD-003',
    product: 'Template Site Web',
    amount: '19 900 FCFA',
    status: 'Livre',
    date: '20 Aout 2026',
  },
  {
    id: '#ORD-004',
    product: 'Cours Photoshop',
    amount: '12 000 FCFA',
    status: 'En attente',
    date: '15 Aout 2026',
  },
];

export default function OrdersPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Mes Commandes</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Suivez vos achats et téléchargements
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total commandes</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
            {orders.filter((o) => o.status === 'Livré').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Livrés</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {orders.filter((o) => o.status !== 'Livré').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>En cours</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                {order.product.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{order.product}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {order.id} • {order.date}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {order.amount}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    background:
                      order.status === 'Livré'
                        ? '#dcfce7'
                        : order.status === 'En cours'
                          ? '#dbeafe'
                          : '#fef3c7',
                    color:
                      order.status === 'Livré'
                        ? 'var(--success)'
                        : order.status === 'En cours'
                          ? '#2563eb'
                          : 'var(--warning)',
                    fontWeight: 600,
                  }}
                >
                  {order.status}
                </span>
              </div>
              {order.status === 'Livré' && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Télécharger
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
