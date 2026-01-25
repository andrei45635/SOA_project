import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { Order, OrderItem, OrderStatus } from '../types';

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

            // Initialize database schema
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
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id VARCHAR(36) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      `);
            console.log('Database schema initialized');
        } finally {
            client.release();
        }
    }

    async createOrder(order: Order): Promise<Order> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO orders (id, user_id, status, total_amount, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [order.id, order.userId, order.status, order.totalAmount, order.createdAt, order.updatedAt]
            );

            for (const item of order.items) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
                    [order.id, item.productId, item.productName, item.quantity, item.price]
                );
            }

            await client.query('COMMIT');
            return order;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getOrderById(orderId: string): Promise<Order | null> {
        const client = await this.pool.connect();
        try {
            const orderResult = await client.query(
                `SELECT id, user_id, status, total_amount, created_at, updated_at
         FROM orders WHERE id = $1`,
                [orderId]
            );

            if (orderResult.rows.length === 0) {
                return null;
            }

            const orderRow = orderResult.rows[0];

            const itemsResult = await client.query(
                `SELECT product_id, product_name, quantity, price
         FROM order_items WHERE order_id = $1`,
                [orderId]
            );

            const items: OrderItem[] = itemsResult.rows.map(row => ({
                productId: row.product_id,
                productName: row.product_name,
                quantity: row.quantity,
                price: parseFloat(row.price),
            }));

            return {
                id: orderRow.id,
                userId: orderRow.user_id,
                status: orderRow.status as OrderStatus,
                totalAmount: parseFloat(orderRow.total_amount),
                items,
                createdAt: orderRow.created_at,
                updatedAt: orderRow.updated_at,
            };
        } finally {
            client.release();
        }
    }

    async getOrdersByUserId(userId: string): Promise<Order[]> {
        const client = await this.pool.connect();
        try {
            const orderResult = await client.query(
                `SELECT id, user_id, status, total_amount, created_at, updated_at
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
                [userId]
            );

            const orders: Order[] = [];

            for (const orderRow of orderResult.rows) {
                const itemsResult = await client.query(
                    `SELECT product_id, product_name, quantity, price
           FROM order_items WHERE order_id = $1`,
                    [orderRow.id]
                );

                const items: OrderItem[] = itemsResult.rows.map(row => ({
                    productId: row.product_id,
                    productName: row.product_name,
                    quantity: row.quantity,
                    price: parseFloat(row.price),
                }));

                orders.push({
                    id: orderRow.id,
                    userId: orderRow.user_id,
                    status: orderRow.status as OrderStatus,
                    totalAmount: parseFloat(orderRow.total_amount),
                    items,
                    createdAt: orderRow.created_at,
                    updatedAt: orderRow.updated_at,
                });
            }

            return orders;
        } finally {
            client.release();
        }
    }

    async getAllOrders(): Promise<Order[]> {
        const client = await this.pool.connect();
        try {
            const orderResult = await client.query(
                `SELECT id, user_id, status, total_amount, created_at, updated_at
         FROM orders ORDER BY created_at DESC`
            );

            const orders: Order[] = [];

            for (const orderRow of orderResult.rows) {
                const itemsResult = await client.query(
                    `SELECT product_id, product_name, quantity, price
           FROM order_items WHERE order_id = $1`,
                    [orderRow.id]
                );

                const items: OrderItem[] = itemsResult.rows.map(row => ({
                    productId: row.product_id,
                    productName: row.product_name,
                    quantity: row.quantity,
                    price: parseFloat(row.price),
                }));

                orders.push({
                    id: orderRow.id,
                    userId: orderRow.user_id,
                    status: orderRow.status as OrderStatus,
                    totalAmount: parseFloat(orderRow.total_amount),
                    items,
                    createdAt: orderRow.created_at,
                    updatedAt: orderRow.updated_at,
                });
            }

            return orders;
        } finally {
            client.release();
        }
    }

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
                [status, orderId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.getOrderById(orderId);
        } finally {
            client.release();
        }
    }

    async deleteOrder(orderId: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM orders WHERE id = $1 RETURNING id`,
                [orderId]
            );
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }

    async getAnalytics(): Promise<{
        totalOrders: number;
        totalRevenue: number;
        ordersByStatus: Record<OrderStatus, number>;
    }> {
        const client = await this.pool.connect();
        try {
            const totalResult = await client.query(
                `SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders`
            );

            const statusResult = await client.query(
                `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
            );

            const ordersByStatus: Record<string, number> = {
                pending: 0,
                confirmed: 0,
                preparing: 0,
                ready: 0,
                delivered: 0,
                cancelled: 0,
            };

            for (const row of statusResult.rows) {
                ordersByStatus[row.status] = parseInt(row.count);
            }

            return {
                totalOrders: parseInt(totalResult.rows[0].total),
                totalRevenue: parseFloat(totalResult.rows[0].revenue),
                ordersByStatus: ordersByStatus as Record<OrderStatus, number>,
            };
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export const databaseService = new DatabaseService();