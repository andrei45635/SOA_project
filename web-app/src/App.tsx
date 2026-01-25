import React, { useState } from 'react';
import { Shell } from './micro-frontends/shell/Shell';
import { OrdersMicroFrontend } from './micro-frontends/orders/Orders';
import { AnalyticsMicroFrontend } from './micro-frontends/analytics/Analytics';
import { NotificationsMicroFrontend } from './micro-frontends/notifications/Notifications';
import { Login } from './components/Login';
import { Home } from './components/Home';
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
    if (!user && currentPath !== '/' && currentPath !== '/login') {
      return <Login onLogin={login} onRegister={register} />;
    }

    switch (currentPath) {
      case '/':
        return <Home user={user} onNavigate={navigate} />;
      case '/login':
        if (user) {
          setCurrentPath('/');
          return <Home user={user} onNavigate={navigate} />;
        }
        return <Login onLogin={login} onRegister={register} />;
      case '/orders':
        return <OrdersMicroFrontend />;
      case '/notifications':
        return (
          <NotificationsMicroFrontend
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
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
        return <AnalyticsMicroFrontend />;
      default:
        return <Home user={user} onNavigate={navigate} />;
    }
  };

  return (
    <Shell
      user={user}
      notifications={notifications}
      unreadCount={unreadCount}
      onLogout={logout}
      onNavigate={navigate}
      currentPath={currentPath}
    >
      {renderContent()}
    </Shell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
  },
  accessDenied: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
};
