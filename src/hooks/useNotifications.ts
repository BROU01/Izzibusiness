'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDemoPhone } from '@/lib/demo-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'game' | 'referral';
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Recuperer les notifications — mises à jour après réponse uniquement.
  const fetchNotifications = useCallback(async (limit = 20, unreadOnly = false) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (unreadOnly) params.append('unread', 'true');
      const demoPhone = getDemoPhone();
      if (demoPhone) params.append('phone', demoPhone);

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, phone: getDemoPhone() }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, phone: getDemoPhone() }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const demoPhone = getDemoPhone();
      const response = await fetch(
        `/api/notifications?id=${notificationId}${demoPhone ? `&phone=${encodeURIComponent(demoPhone)}` : ''}`,
        { method: 'DELETE' },
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Recalculer le compteur
        setNotifications((prev) => {
          const unread = prev.filter((n) => !n.read).length;
          setUnreadCount(unread);
          return prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Charger au montage — le setState n'arrive qu'après la réponse réseau.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const params = new URLSearchParams({ limit: '20' });
        const demoPhone = getDemoPhone();
        if (demoPhone) params.append('phone', demoPhone);
        const response = await fetch(`/api/notifications?${params}`);
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Polling toutes les 30 secondes pour les nouvelles notifs
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
