import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import { wsService } from '../services/websocket.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (data: unknown) => {
      const notification = data as Notification;
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    };

    wsService.on('notification', handleNotification);

    return () => {
      wsService.off('notification', handleNotification);
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, clearAll };
}
