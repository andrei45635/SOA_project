import React from 'react';
import { Notification } from './types';

interface Props {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

function Notifications({ notifications, onMarkAsRead, onClearAll }: Props) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = { EMAIL: '📧', PUSH: '📱', WEBSOCKET: '⚡' };
    return icons[type] || '🔔';
  };

  return (
    <div style={styles.container}>
      <div style={styles.mfeBadge}>🔔 Notifications Micro-Frontend (Port 5003)</div>
      
      <div style={styles.header}>
        <h1>Notifications</h1>
        <div style={styles.headerActions}>
          <span style={styles.badge}>{unreadCount} unread</span>
          {notifications.length > 0 && (
            <button style={styles.clearButton} onClick={onClearAll}>Clear All</button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <p>🔔 No notifications yet</p>
          <p style={styles.emptyHint}>Notifications will appear here when you place orders or receive updates.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                ...styles.notification,
                backgroundColor: notification.read ? '#f9f9f9' : '#fff',
                borderLeft: notification.read ? '4px solid #ddd' : '4px solid #3498db',
              }}
              onClick={() => !notification.read && onMarkAsRead(notification.id)}
            >
              <div style={styles.notificationHeader}>
                <span style={styles.notificationType}>{getTypeIcon(notification.type)} {notification.type}</span>
                <span style={styles.notificationTime}>{formatTime(notification.createdAt)}</span>
              </div>
              <h3 style={styles.notificationTitle}>{notification.title}</h3>
              <p style={styles.notificationMessage}>{notification.message}</p>
              {!notification.read && <span style={styles.unreadBadge}>New</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '0 auto' },
  mfeBadge: { backgroundColor: '#e8f8f5', color: '#1abc9c', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', display: 'inline-block' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '1rem' },
  badge: { backgroundColor: '#3498db', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' },
  clearButton: { padding: '0.5rem 1rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  emptyHint: { color: '#666', marginTop: '0.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  notification: { padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', position: 'relative' },
  notificationHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  notificationType: { fontSize: '0.8rem', color: '#666' },
  notificationTime: { fontSize: '0.8rem', color: '#999' },
  notificationTitle: { margin: '0 0 0.5rem 0', fontSize: '1.1rem' },
  notificationMessage: { margin: 0, color: '#666' },
  unreadBadge: { position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#e74c3c', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' },
};

export default Notifications;
