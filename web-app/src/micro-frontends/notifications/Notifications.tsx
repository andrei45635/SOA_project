import React from 'react';
import { Notification } from '../../types';

interface NotificationsMicroFrontendProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationsMicroFrontend({
  notifications,
  onMarkAsRead,
  onClearAll,
}: NotificationsMicroFrontendProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Notifications</h1>
        {notifications.length > 0 && (
          <button style={styles.clearButton} onClick={onClearAll}>
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <p>No notifications yet</p>
          <p style={styles.emptyHint}>
            You'll receive real-time notifications when your orders are updated.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map((notification, index) => (
            <div
              key={notification.id || index}
              style={{
                ...styles.item,
                ...(notification.read ? styles.itemRead : {}),
              }}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div style={styles.itemHeader}>
                <span style={styles.itemTitle}>{notification.title}</span>
                <span style={styles.itemType}>{notification.type}</span>
              </div>
              <p style={styles.itemMessage}>{notification.message}</p>
              <div style={styles.itemFooter}>
                <span style={styles.itemTime}>
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : 'Just now'}
                </span>
                {!notification.read && <span style={styles.unreadBadge}>New</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  emptyHint: {
    color: '#666',
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    borderLeft: '4px solid #3498db',
    transition: 'transform 0.2s ease',
  },
  itemRead: {
    borderLeftColor: '#ccc',
    opacity: 0.7,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  itemType: {
    backgroundColor: '#eee',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#666',
  },
  itemMessage: {
    color: '#333',
    margin: '0.5rem 0',
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  itemTime: {
    color: '#666',
    fontSize: '0.85rem',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
};
