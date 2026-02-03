import React from 'react';
import ReactDOM from 'react-dom/client';
import Orders from './Orders';

// For standalone development/testing
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Orders user={{ id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' }} />
    </div>
  </React.StrictMode>
);
