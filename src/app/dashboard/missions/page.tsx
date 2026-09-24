'use client';

const missions = [
  {
    id: 1,
    title: 'Partager Izzibusiness sur WhatsApp',
    reward: 500,
    status: 'available',
    difficulty: 'Facile',
  },
  {
    id: 2,
    title: 'Inscrire 3 amis',
    reward: 1500,
    status: 'in_progress',
    progress: 2,
    total: 3,
    difficulty: 'Moyen',
  },
  {
    id: 3,
    title: 'Jouer a 5 parties Aviator',
    reward: 1000,
    status: 'completed',
    difficulty: 'Facile',
  },
  { id: 4, title: 'Deposer 10 000 FCFA', reward: 500, status: 'completed', difficulty: 'Facile' },
  {
    id: 5,
    title: 'Completer votre profil',
    reward: 200,
    status: 'completed',
    difficulty: 'Facile',
  },
  {
    id: 6,
    title: 'Vendre un produit sur le Market',
    reward: 2000,
    status: 'available',
    difficulty: 'Difficile',
  },
  {
    id: 7,
    title: 'Atteindre 50 000 FCFA de gains',
    reward: 5000,
    status: 'available',
    difficulty: 'Difficile',
  },
  {
    id: 8,
    title: 'Parrainer 10 personnes',
    reward: 3000,
    status: 'available',
    difficulty: 'Moyen',
  },
];

export default function MissionsPage() {
  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const totalReward = missions
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + m.reward, 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Missions</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Complétez des tâches pour gagner des récompenses
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          padding: '20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
            {completedMissions}/{missions.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Missions complétées</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
            {totalReward.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gagnées</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Progression globale</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {((completedMissions / missions.length) * 100).toFixed(0)}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            background: 'var(--border)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(completedMissions / missions.length) * 100}%`,
              background: 'var(--accent)',
              borderRadius: '4px',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Missions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="card"
            style={{
              opacity: mission.status === 'completed' ? 0.7 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius)',
                  background:
                    mission.status === 'completed' ? 'var(--success)' : 'var(--accent-light)',
                  color: mission.status === 'completed' ? 'white' : 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {mission.id}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{mission.title}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background:
                        mission.difficulty === 'Facile'
                          ? '#dcfce7'
                          : mission.difficulty === 'Moyen'
                            ? '#fef3c7'
                            : '#fee2e2',
                      color:
                        mission.difficulty === 'Facile'
                          ? 'var(--success)'
                          : mission.difficulty === 'Moyen'
                            ? 'var(--warning)'
                            : 'var(--error)',
                      fontWeight: 600,
                    }}
                  >
                    {mission.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Récompense:{' '}
                  <strong style={{ color: '#22c55e' }}>
                    {mission.reward.toLocaleString()} FCFA
                  </strong>
                </div>
                {mission.status === 'in_progress' && mission.progress !== undefined && (
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Progression</span>
                      <span>
                        {mission.progress}/{mission.total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'var(--border)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(mission.progress / (mission.total || 1)) * 100}%`,
                          background: 'var(--accent)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                {mission.status === 'completed' && (
                  <span
                    style={{
                      padding: '6px 12px',
                      background: '#dcfce7',
                      color: 'var(--success)',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Terminé
                  </span>
                )}
                {mission.status === 'available' && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Commencer
                  </button>
                )}
                {mission.status === 'in_progress' && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Continuer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
