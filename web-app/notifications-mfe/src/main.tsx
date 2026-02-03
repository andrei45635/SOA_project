import React from 'react';
import ReactDOM from 'react-dom/client';
import Notifications from './Notifications';

const mockNotifications = [
  { id: '1', userId: '1', type: 'WEBSOCKET' as const, title: 'Order Created', message: 'Your order #abc123 has been placed!', read: false, createdAt: new Date().toISOString() },
  { id: '2', userId: '1', type: 'EMAIL' as const, title: 'Order Confirmed', message: 'Your order is being prepared.', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Notifications notifications={mockNotifications} onMarkAsRead={console.log} onClearAll={console.log} />
    </div>
  </React.StrictMode>
);
