import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const products = [
  { name: 'Formation Marketing Digital', price: '15 000 XOF', category: 'Formation' },
  { name: 'Pack E-commerce Complet', price: '25 000 XOF', category: 'Formation' },
  { name: 'Guide Affiliation Pro', price: '9 900 XOF', category: 'Guide' },
  { name: 'Template Site Web', price: '19 900 XOF', category: 'Template' },
  { name: 'Cours Photoshop Debutant', price: '12 000 XOF', category: 'Formation' },
  { name: 'Pack Logo Premium', price: '8 500 XOF', category: 'Design' },
];

const categories = ['Tous', 'Formation', 'Guide', 'Template', 'Design'];

export default function Market() {
  return (
    <>
      <Navbar />
      <section className="section">
        <div className="container">
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Marketplace</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Découvrez nos produits et formations
          </p>

          {/* Categories */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {categories.map((cat, i) => (
              <button
                key={i}
                className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-3">
            {products.map((product, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer' }}>
                <div
                  style={{
                    height: '140px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {product.name.charAt(0)}
                  </span>
                </div>
                <div className="badge" style={{ marginBottom: '8px' }}>
                  {product.category}
                </div>
                <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>{product.name}</h3>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {product.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
