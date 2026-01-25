import { Pool } from 'pg';
import { config } from '../config';
import { AnalyticsEvent, DailyStats, UserStats, AnalyticsDashboard } from '../types';

class DatabaseService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: config.database.url,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected database error:', err);
        });
    }

    async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            console.log('Connected to PostgreSQL');
            client.release();
            await this.initSchema();
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }

    private async initSchema(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          order_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          amount DECIMAL(10, 2),
          status VARCHAR(20),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_stats (
          date DATE PRIMARY KEY,
          total_orders INTEGER DEFAULT 0,
          total_revenue DECIMAL(12, 2) DEFAULT 0,
          cancelled_orders INTEGER DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_stats (
          user_id VARCHAR(36) PRIMARY KEY,
          total_orders INTEGER DEFAULT 0,
          total_spent DECIMAL(12, 2) DEFAULT 0,
          last_order_date TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_order_id ON analytics_events(order_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      `);
            console.log('Analytics database schema initialized');
        } finally {
            client.release();
        }
    }

    async storeEvent(event: AnalyticsEvent): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(
                `INSERT INTO analytics_events (event_type, order_id, user_id, amount, status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [event.eventType, event.orderId, event.userId, event.amount || null, event.status || null, event.timestamp]
            );
        } finally {
            client.release();
        }
    }

    async updateDailyStats(date: Date, amount: number, isCancelled: boolean): Promise<void> {
        const client = await this.pool.connect();
        const dateStr = date.toISOString().split('T')[0];

        try {
            await client.query(`
        INSERT INTO daily_stats (date, total_orders, total_revenue, cancelled_orders)
        VALUES ($1, 1, $2, $3)
        ON CONFLICT (date) DO UPDATE SET
          total_orders = daily_stats.total_orders + 1,
          total_revenue = daily_stats.total_revenue + $2,
          cancelled_orders = daily_stats.cancelled_orders + $3,
          updated_at = CURRENT_TIMESTAMP
      `, [dateStr, isCancelled ? 0 : amount, isCancelled ? 1 : 0]);
        } finally {
            client.release();
        }
    }

    async updateUserStats(userId: string, amount: number, timestamp: Date): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(`
        INSERT INTO user_stats (user_id, total_orders, total_spent, last_order_date)
        VALUES ($1, 1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
          total_orders = user_stats.total_orders + 1,
          total_spent = user_stats.total_spent + $2,
          last_order_date = GREATEST(user_stats.last_order_date, $3),
          updated_at = CURRENT_TIMESTAMP
      `, [userId, amount, timestamp]);
        } finally {
            client.release();
        }
    }

    async getDashboard(): Promise<AnalyticsDashboard> {
        const client = await this.pool.connect();
        try {
            const summaryResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE event_type = 'ORDER_CREATED') as total_orders,
          COALESCE(SUM(amount) FILTER (WHERE event_type = 'ORDER_CREATED'), 0) as total_revenue,
          COUNT(*) FILTER (WHERE event_type = 'ORDER_CANCELLED') as cancelled_orders
        FROM analytics_events
      `);

            const summary = summaryResult.rows[0];
            const totalOrders = parseInt(summary.total_orders) || 0;
            const totalRevenue = parseFloat(summary.total_revenue) || 0;
            const cancelledOrders = parseInt(summary.cancelled_orders) || 0;

            const dailyResult = await client.query(`
        SELECT 
          date,
          total_orders,
          total_revenue,
          cancelled_orders,
          CASE WHEN total_orders > 0 
            THEN total_revenue / total_orders 
            ELSE 0 
          END as average_order_value
        FROM daily_stats
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
      `);

            const dailyStats: DailyStats[] = dailyResult.rows.map(row => ({
                date: row.date.toISOString().split('T')[0],
                totalOrders: parseInt(row.total_orders),
                totalRevenue: parseFloat(row.total_revenue),
                cancelledOrders: parseInt(row.cancelled_orders),
                averageOrderValue: parseFloat(row.average_order_value),
            }));

            const usersResult = await client.query(`
        SELECT user_id, total_orders, total_spent, last_order_date
        FROM user_stats
        ORDER BY total_spent DESC
        LIMIT 10
      `);

            const topUsers: UserStats[] = usersResult.rows.map(row => ({
                userId: row.user_id,
                totalOrders: parseInt(row.total_orders),
                totalSpent: parseFloat(row.total_spent),
                lastOrderDate: row.last_order_date,
            }));

            const statusResult = await client.query(`
        SELECT status, COUNT(*) as count
        FROM analytics_events
        WHERE status IS NOT NULL
        GROUP BY status
      `);

            const ordersByStatus: Record<string, number> = {};
            for (const row of statusResult.rows) {
                ordersByStatus[row.status] = parseInt(row.count);
            }

            const eventsResult = await client.query(`
        SELECT event_type, order_id, user_id, amount, status, timestamp
        FROM analytics_events
        ORDER BY timestamp DESC
        LIMIT 20
      `);

            const recentEvents: AnalyticsEvent[] = eventsResult.rows.map(row => ({
                eventType: row.event_type,
                orderId: row.order_id,
                userId: row.user_id,
                amount: row.amount ? parseFloat(row.amount) : undefined,
                status: row.status,
                timestamp: row.timestamp,
            }));

            return {
                summary: {
                    totalOrders,
                    totalRevenue,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    cancelledOrders,
                    cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
                },
                dailyStats,
                topUsers,
                ordersByStatus,
                recentEvents,
            };
        } finally {
            client.release();
        }
    }

    async getStatsByDateRange(startDate: Date, endDate: Date): Promise<DailyStats[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT 
          date,
          total_orders,
          total_revenue,
          cancelled_orders,
          CASE WHEN total_orders > 0 
            THEN total_revenue / total_orders 
            ELSE 0 
          END as average_order_value
        FROM daily_stats
        WHERE date >= $1 AND date <= $2
        ORDER BY date DESC
      `, [startDate, endDate]);

            return result.rows.map(row => ({
                date: row.date.toISOString().split('T')[0],
                totalOrders: parseInt(row.total_orders),
                totalRevenue: parseFloat(row.total_revenue),
                cancelledOrders: parseInt(row.cancelled_orders),
                averageOrderValue: parseFloat(row.average_order_value),
            }));
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export const databaseService = new DatabaseService();