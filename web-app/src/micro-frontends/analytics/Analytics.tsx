import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from '../../types';
import { apiService } from '../../services/api.service';

export function AnalyticsMicroFrontend() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
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
  if (!dashboard) return null;

  return (
    <div style={styles.container}>
      <h1>Analytics Dashboard</h1>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3>Total Orders</h3>
          <p style={styles.summaryValue}>{dashboard.summary.totalOrders}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Total Revenue</h3>
          <p style={styles.summaryValue}>${dashboard.summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Avg Order Value</h3>
          <p style={styles.summaryValue}>${dashboard.summary.averageOrderValue.toFixed(2)}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Cancellation Rate</h3>
          <p style={styles.summaryValue}>{dashboard.summary.cancellationRate.toFixed(1)}%</p>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3>Orders by Status</h3>
          <div style={styles.statusBars}>
            {Object.entries(dashboard.ordersByStatus).map(([status, count]) => (
              <div key={status} style={styles.statusBar}>
                <span style={styles.statusLabel}>{status}</span>
                <div style={styles.barContainer}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${Math.min(100, (count / Math.max(...Object.values(dashboard.ordersByStatus))) * 100)}%`,
                      backgroundColor: getStatusColor(status),
                    }}
                  />
                </div>
                <span style={styles.statusCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3>Top Customers</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Orders</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topUsers.slice(0, 5).map(user => (
                <tr key={user.userId}>
                  <td>{user.userId.slice(0, 8)}...</td>
                  <td>{user.totalOrders}</td>
                  <td>${user.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.recentSection}>
        <h3>Recent Events</h3>
        <div style={styles.eventsList}>
          {dashboard.recentEvents.slice(0, 10).map((event, i) => (
            <div key={i} style={styles.eventItem}>
              <span style={{ ...styles.eventType, backgroundColor: getEventColor(event.eventType) }}>
                {event.eventType.replace('ORDER_', '')}
              </span>
              <span style={styles.eventOrder}>#{event.orderId.slice(0, 8)}</span>
              {event.amount && <span style={styles.eventAmount}>${event.amount.toFixed(2)}</span>}
              <span style={styles.eventTime}>
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.dailySection}>
        <h3>Daily Stats (Last 30 Days)</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Cancelled</th>
              <th>Avg Value</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.dailyStats.map(day => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.totalOrders}</td>
                <td>${day.totalRevenue.toFixed(2)}</td>
                <td>{day.cancelledOrders}</td>
                <td>${day.averageOrderValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f39c12',
    confirmed: '#3498db',
    preparing: '#9b59b6',
    ready: '#2ecc71',
    delivered: '#27ae60',
    cancelled: '#e74c3c',
  };
  return colors[status] || '#666';
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    ORDER_CREATED: '#27ae60',
    ORDER_UPDATED: '#3498db',
    ORDER_CANCELLED: '#e74c3c',
  };
  return colors[eventType] || '#666';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '1rem',
    borderRadius: '8px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '0.5rem 0 0 0',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statusBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusLabel: {
    width: '80px',
    textTransform: 'capitalize',
  },
  barContainer: {
    flex: 1,
    height: '20px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  statusCount: {
    width: '40px',
    textAlign: 'right',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  recentSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem',
    borderBottom: '1px solid #eee',
  },
  eventType: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.8rem',
  },
  eventOrder: {
    fontFamily: 'monospace',
  },
  eventAmount: {
    fontWeight: 'bold',
  },
  eventTime: {
    marginLeft: 'auto',
    color: '#666',
    fontSize: '0.85rem',
  },
  dailySection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};
