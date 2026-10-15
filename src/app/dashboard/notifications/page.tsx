'use client';

import { useNotifications } from '@/hooks/useNotifications';

const typeColors: Record<string, { bg: string; text: string }> = {
  info: { bg: 'var(--paper-2)', text: 'var(--sky)' },
  success: { bg: '#d6f5e8', text: '#00744a' },
  warning: { bg: 'var(--acid)', text: '#b8320d' },
  error: { bg: '#ffe1d6', text: '#b8320d' },
  transaction: { bg: 'var(--paper-2)', text: 'var(--sky)' },
  game: { bg: 'var(--paper-2)', text: '#b8320d' },
  referral: { bg: '#d6f5e8', text: '#00744a' },
};

const typeLabels: Record<string, string> = {
  info: 'Info',
  success: 'Succes',
  warning: 'Attention',
  error: 'Erreur',
  transaction: 'Transaction',
  game: 'Jeu',
  referral: 'Parrainage',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

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
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Notifications</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          Chargement...
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: '0 auto' }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p style={{ fontSize: '14px' }}>Aucune notification</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Vous serez notifie des importantes activites
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((notification) => {
            const colors = typeColors[notification.type] || typeColors.info;
            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.actionUrl) window.location.href = notification.actionUrl;
                }}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: notification.read ? 'var(--bg-card)' : 'var(--bg-secondary)',
                  border: `1px solid ${notification.read ? 'var(--border)' : colors.text + '30'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {/* Type badge */}
                <div
                  style={{
                    padding: '4px 10px',
                    background: colors.bg,
                    color: colors.text,
                    fontSize: '11px',
                    fontWeight: 600,
                    alignSelf: 'flex-start',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {typeLabels[notification.type]}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: notification.read ? 500 : 600,
                      marginBottom: '4px',
                    }}
                  >
                    {notification.title}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      marginBottom: '8px',
                    }}
                  >
                    {notification.message}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Lu
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'none',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
