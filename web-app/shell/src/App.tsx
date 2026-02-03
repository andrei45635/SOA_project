import React, { useState } from 'react';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { MicroFrontendLoader } from './components/MicroFrontendLoader';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';

type Route = '/' | '/login' | '/orders' | '/notifications' | '/analytics';

export function App() {
  const { user, loading, login, register, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [currentPath, setCurrentPath] = useState<Route>('/');

  const navigate = (path: string) => {
    setCurrentPath(path as Route);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  const renderContent = () => {
    // Redirect to login if not authenticated
    if (!user && currentPath !== '/' && currentPath !== '/login') {
      return <Login onLogin={login} onRegister={register} />;
    }

    switch (currentPath) {
      case '/':
        return (
          <div style={styles.home}>
            <h1>Welcome to Order Management System</h1>
            <p>A micro-frontend demonstration with real-time capabilities</p>
            
            <div style={styles.mfeInfo}>
              <h2>🧩 Micro-Frontend Architecture</h2>
              <div style={styles.mfeGrid}>
                <div style={styles.mfeCard}>
                  <h3>📦 Orders MFE</h3>
                  <p>Port 5001</p>
                  <p>Browse menu, place orders, admin management</p>
                </div>
                <div style={styles.mfeCard}>
                  <h3>📊 Analytics MFE</h3>
                  <p>Port 5002</p>
                  <p>Dashboard, stats, reports (admin only)</p>
                </div>
                <div style={styles.mfeCard}>
                  <h3>🔔 Notifications MFE</h3>
                  <p>Port 5003</p>
                  <p>Real-time notifications, history</p>
                </div>
                <div style={styles.mfeCard}>
                  <h3>🏠 Shell (Host)</h3>
                  <p>Port 5000</p>
                  <p>Container app, routing, auth</p>
                </div>
              </div>
            </div>
            
            {!user && (
              <button style={styles.ctaButton} onClick={() => navigate('/login')}>
                Get Started
              </button>
            )}
          </div>
        );

      case '/login':
        if (user) {
          setCurrentPath('/');
          return null;
        }
        return <Login onLogin={login} onRegister={register} />;

      case '/orders':
        return <MicroFrontendLoader name="orders" componentProps={{ user }} />;

      case '/notifications':
        return (
          <MicroFrontendLoader
            name="notifications"
            componentProps={{ notifications, onMarkAsRead: markAsRead, onClearAll: clearAll }}
          />
        );

      case '/analytics':
        if (user?.role !== 'admin') {
          return (
            <div style={styles.accessDenied}>
              <h2>Access Denied</h2>
              <p>You need admin privileges to view analytics.</p>
            </div>
          );
        }
        return <MicroFrontendLoader name="analytics" />;

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <Header
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        currentPath={currentPath}
        onNavigate={navigate}
        onLogout={logout}
      />
      <main style={styles.main}>{renderContent()}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  main: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
  },
  home: {
    textAlign: 'center',
    padding: '2rem',
  },
  mfeInfo: {
    marginTop: '3rem',
    textAlign: 'left',
  },
  mfeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  mfeCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  ctaButton: {
    marginTop: '2rem',
    padding: '1rem 2rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  accessDenied: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
};
