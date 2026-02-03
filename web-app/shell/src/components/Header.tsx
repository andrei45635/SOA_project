import React from 'react';
import { User, Notification } from '../types';

interface Props {
  user: User | null;
  notifications: Notification[];
  unreadCount: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function Header({ user, unreadCount, currentPath, onNavigate, onLogout }: Props) {
  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/orders', label: '📦 Orders' },
    { path: '/notifications', label: `🔔 Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/analytics', label: '📊 Analytics' });
  }

  return (
    <header style={styles.header}>
      <div style={styles.logo} onClick={() => onNavigate('/')}>
        🍕 Order System
      </div>
      
      <nav style={styles.nav}>
        {user && navItems.map(item => (
          <button
            key={item.path}
            style={{
              ...styles.navButton,
              backgroundColor: currentPath === item.path ? '#2980b9' : 'transparent',
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
            <span style={styles.userName}>
              {user.name} {user.role === 'admin' && '👑'}
            </span>
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    backgroundColor: '#3498db',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
  },
  navButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    fontWeight: '500',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
  },
  loginButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '4px',
    color: '#3498db',
    cursor: 'pointer',
    fontWeight: '500',
  },
};
