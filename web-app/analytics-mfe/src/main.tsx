import React from 'react';
import ReactDOM from 'react-dom/client';
import Analytics from './Analytics';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Analytics />
    </div>
  </React.StrictMode>
);
