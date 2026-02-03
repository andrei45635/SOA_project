import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from './types';
import { apiService } from './services/api.service';

function Analytics() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAnalytics();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!dashboard) return <div style={styles.error}>No data available</div>;

  const summary = dashboard.summary || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, cancelledOrders: 0, cancellationRate: 0 };
  const ordersByStatus = dashboard.ordersByStatus || {};
  const recentEvents = dashboard.recentEvents || [];

  return (
    <div style={styles.container}>
      <div style={styles.mfeBadge}>📊 Analytics Micro-Frontend (Port 5002)</div>
      
      <h1>Analytics Dashboard</h1>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3>Total Orders</h3>
          <p style={styles.summaryValue}>{summary.totalOrders}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Total Revenue</h3>
          <p style={styles.summaryValue}>${(summary.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Avg Order Value</h3>
          <p style={styles.summaryValue}>${(summary.averageOrderValue || 0).toFixed(2)}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Cancellation Rate</h3>
          <p style={styles.summaryValue}>{(summary.cancellationRate || 0).toFixed(1)}%</p>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3>Orders by Status</h3>
          {Object.keys(ordersByStatus).length === 0 ? (
            <p>No order data yet</p>
          ) : (
            <div style={styles.statusBars}>
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <div key={status} style={styles.statusBar}>
                  <span style={styles.statusLabel}>{status}</span>
                  <div style={styles.barContainer}>
                    <div style={{
                      ...styles.bar,
                      width: `${Math.min(100, (count / Math.max(...Object.values(ordersByStatus))) * 100)}%`,
                      backgroundColor: getStatusColor(status),
                    }} />
                  </div>
                  <span style={styles.statusCount}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.recentSection}>
        <h3>Recent Events</h3>
        {recentEvents.length === 0 ? (
          <p>No recent events</p>
        ) : (
          <div style={styles.eventsList}>
            {recentEvents.slice(0, 10).map((event, i) => (
              <div key={i} style={styles.eventItem}>
                <span style={{ ...styles.eventType, backgroundColor: getEventColor(event.eventType) }}>
                  {event.eventType.replace('ORDER_', '')}
                </span>
                <span style={styles.eventOrder}>#{event.orderId.slice(0, 8)}</span>
                {event.amount && <span style={styles.eventAmount}>${event.amount.toFixed(2)}</span>}
                <span style={styles.eventTime}>{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f39c12', confirmed: '#3498db', preparing: '#9b59b6',
    ready: '#2ecc71', delivered: '#27ae60', cancelled: '#e74c3c',
  };
  return colors[status] || '#666';
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    ORDER_CREATED: '#27ae60', ORDER_UPDATED: '#3498db', ORDER_CANCELLED: '#e74c3c',
  };
  return colors[eventType] || '#666';
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto' },
  mfeBadge: { backgroundColor: '#fef3e2', color: '#e67e22', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', display: 'inline-block' },
  loading: { textAlign: 'center', padding: '2rem' },
  error: { backgroundColor: '#fee', color: '#c00', padding: '1rem', borderRadius: '8px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  summaryCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' },
  summaryValue: { fontSize: '2rem', fontWeight: 'bold', color: '#3498db', margin: '0.5rem 0 0 0' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' },
  chartCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statusBars: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  statusBar: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statusLabel: { width: '80px', textTransform: 'capitalize' },
  barContainer: { flex: 1, height: '20px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' },
  bar: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  statusCount: { width: '40px', textAlign: 'right' },
  recentSection: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  eventsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  eventItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid #eee' },
  eventType: { padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', fontSize: '0.8rem' },
  eventOrder: { fontFamily: 'monospace' },
  eventAmount: { fontWeight: 'bold' },
  eventTime: { marginLeft: 'auto', color: '#666', fontSize: '0.85rem' },
};

export default Analytics;
