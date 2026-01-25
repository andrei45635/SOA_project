import React, { useState } from 'react';
import { User, Notification } from '../../types';

interface ShellProps {
  user: User | null;
  notifications: Notification[];
  unreadCount: number;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
  children: React.ReactNode;
}

export function Shell({ user, notifications, unreadCount, onLogout, onNavigate, currentPath, children }: ShellProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/orders', label: 'Orders' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/analytics', label: 'Analytics' });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => onNavigate('/')}>
          Order Management System
        </div>
        <nav style={styles.nav}>
          {user && navItems.map(item => (
            <button
              key={item.path}
              style={{
                ...styles.navButton,
                ...(currentPath === item.path ? styles.navButtonActive : {}),
              }}
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div style={styles.userSection}>
          {user ? (
            <>
              <div style={styles.notificationWrapper}>
                <button
                  style={styles.notificationButton}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔 {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div style={styles.notificationDropdown}>
                    <div style={styles.notificationHeader}>Notifications</div>
                    {notifications.length === 0 ? (
                      <div style={styles.noNotifications}>No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n, i) => (
                        <div key={i} style={styles.notificationItem}>
                          <strong>{n.title}</strong>
                          <p>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRole}>({user.role})</span>
              <button style={styles.logoutButton} onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button style={styles.loginButton} onClick={() => onNavigate('/login')}>
              Login
            </button>
          )}
        </div>
      </header>
      <main style={styles.main}>{children}</main>
      <footer style={styles.footer}>
        <p>Microservices Demo - Built with React, TypeScript, and ❤️</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: '2rem',
  },
  navButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  navButtonActive: {
    backgroundColor: '#4a4a6a',
  },
  userSection: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  notificationWrapper: {
    position: 'relative',
  },
  notificationButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '0.7rem',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    color: '#333',
  },
  notificationHeader: {
    padding: '1rem',
    borderBottom: '1px solid #eee',
    fontWeight: 'bold',
  },
  notificationItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #eee',
  },
  noNotifications: {
    padding: '1rem',
    color: '#666',
    textAlign: 'center',
  },
  userName: {
    fontWeight: 'bold',
  },
  userRole: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loginButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#f5f5f5',
  },
  footer: {
    padding: '1rem 2rem',
    backgroundColor: '#1a1a2e',
    color: '#aaa',
    textAlign: 'center',
  },
};
