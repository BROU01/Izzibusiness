const products = [
  {
    id: 1,
    name: 'Formation Marketing Digital',
    price: '15 000 XOF',
    category: 'Formation',
    status: 'Actif',
    sales: 45,
  },
  {
    id: 2,
    name: 'Pack E-commerce Complet',
    price: '25 000 XOF',
    category: 'Formation',
    status: 'Actif',
    sales: 32,
  },
  {
    id: 3,
    name: 'Guide Affiliation Pro',
    price: '9 900 XOF',
    category: 'Guide',
    status: 'Actif',
    sales: 67,
  },
  {
    id: 4,
    name: 'Template Site Web',
    price: '19 900 XOF',
    category: 'Template',
    status: 'Brouillon',
    sales: 0,
  },
  {
    id: 5,
    name: 'Cours Photoshop Débutant',
    price: '12 000 XOF',
    category: 'Formation',
    status: 'Actif',
    sales: 28,
  },
  {
    id: 6,
    name: 'Pack Logo Premium',
    price: '8 500 XOF',
    category: 'Design',
    status: 'Actif',
    sales: 19,
  },
];

export default function AdminProducts() {
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
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Produits</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Gérez vos produits et formations
          </p>
        </div>
        <button className="btn btn-primary">+ Ajouter un produit</button>
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
                Catégorie
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
                Prix
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
                Ventes
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
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600 }}>
                  {product.name}
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span className="badge">{product.category}</span>
                </td>
                <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600 }}>
                  {product.price}
                </td>
                <td style={{ padding: '12px 0', fontSize: '13px' }}>{product.sales}</td>
                <td style={{ padding: '12px 0' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: product.status === 'Actif' ? '#dcfce7' : '#f5f5f4',
                      color: product.status === 'Actif' ? 'var(--success)' : 'var(--text-muted)',
                    }}
                  >
                    {product.status}
                  </span>
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
                    Modifier
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
