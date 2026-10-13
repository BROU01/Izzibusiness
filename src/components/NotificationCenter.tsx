'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationCenterProps {
  compact?: boolean;
}

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

export default function NotificationCenter({ compact = false }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleClick = (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = 'var(--bg-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'none';
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '18px',
              height: '18px',
              background: '#b8320d',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: compact ? '320px' : '380px',
              maxHeight: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      padding: '2px 8px',
                      background: '#ffe1d6',
                      color: '#b8320d',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {loading ? (
                <div
                  style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  Aucune notification
                </div>
              ) : (
                notifications.map((notification) => {
                  const colors = typeColors[notification.type] || typeColors.info;
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleClick(notification)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: notification.read ? 'transparent' : 'var(--bg-secondary)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = notification.read
                          ? 'transparent'
                          : 'var(--bg-secondary)';
                      }}
                    >
                      {/* Type indicator */}
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          background: notification.read ? 'var(--border)' : colors.text,
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: notification.read ? 500 : 600,
                            marginBottom: '2px',
                          }}
                        >
                          {notification.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            lineHeight: '1.4',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {notification.message}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              padding: '1px 6px',
                              background: colors.bg,
                              color: colors.text,
                              fontSize: '10px',
                              fontWeight: 600,
                            }}
                          >
                            {typeLabels[notification.type]}
                          </span>
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        aria-label={`Supprimer la notification : ${notification.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        aria-hidden="true"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '4px',
                          opacity: 0.5,
                          alignSelf: 'flex-start',
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.5';
                        }}
                      >
                        x
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href="/dashboard/notifications"
                  style={{
                    fontSize: '13px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
