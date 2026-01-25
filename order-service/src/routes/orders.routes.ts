import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '../services/database.service';
import { kafkaService } from '../services/kafka.service';
import { rabbitMQService } from '../services/rabbitmq.service';
import { Order, OrderItem, CreateOrderRequest, UpdateOrderRequest, OrderStatus } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const userRole = req.headers['x-user-role'] as string;

        let orders: Order[];

        if (userRole === 'admin' && !userId) {
            orders = await databaseService.getAllOrders();
        } else if (userId) {
            orders = await databaseService.getOrdersByUserId(userId);
        } else {
            res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
            return;
        }

        res.json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
        });
    }
});

router.get('/all', async (req: Request, res: Response) => {
    try {
        const userRole = req.headers['x-user-role'] as string;

        if (userRole !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Admin access required',
            });
            return;
        }

        const orders = await databaseService.getAllOrders();

        res.json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
        });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;

        const order = await databaseService.getOrderById(id);

        if (!order) {
            res.status(404).json({
                success: false,
                error: 'Order not found',
            });
            return;
        }

        if (userRole !== 'admin' && order.userId !== userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
        });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, items } = req.body as CreateOrderRequest;

        if (!userId || !items || items.length === 0) {
            res.status(400).json({
                success: false,
                error: 'User ID and at least one item are required',
            });
            return;
        }

        const totalAmount = items.reduce((sum: number, item: OrderItem) => {
            return sum + item.price * item.quantity;
        }, 0);

        const now = new Date();
        const order: Order = {
            id: uuidv4(),
            userId,
            items,
            status: 'pending',
            totalAmount,
            createdAt: now,
            updatedAt: now,
        };

        await databaseService.createOrder(order);

        const orderEvent = {
            type: 'ORDER_CREATED' as const,
            orderId: order.id,
            userId: order.userId,
            data: order,
            timestamp: now,
        };

        await kafkaService.publishOrderEvent(orderEvent);
        await kafkaService.publishAnalyticsEvent({
            eventType: 'ORDER_CREATED',
            orderId: order.id,
            userId: order.userId,
            amount: order.totalAmount,
            status: order.status,
            timestamp: now,
        });

        await rabbitMQService.publishOrderEvent(orderEvent);

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully',
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
        });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body as UpdateOrderRequest;
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;

        const existingOrder = await databaseService.getOrderById(id);

        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found',
            });
            return;
        }

        if (userRole !== 'admin' && existingOrder.userId !== userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
            return;
        }

        const updatedOrder = await databaseService.updateOrderStatus(id, status || existingOrder.status);

        if (!updatedOrder) {
            res.status(500).json({
                success: false,
                error: 'Failed to update order',
            });
            return;
        }

        const now = new Date();
        const orderEvent = {
            type: 'ORDER_UPDATED' as const,
            orderId: updatedOrder.id,
            userId: updatedOrder.userId,
            data: updatedOrder,
            timestamp: now,
        };

        await kafkaService.publishOrderEvent(orderEvent);
        await kafkaService.publishAnalyticsEvent({
            eventType: 'ORDER_UPDATED',
            orderId: updatedOrder.id,
            userId: updatedOrder.userId,
            status: updatedOrder.status,
            timestamp: now,
        });

        await rabbitMQService.publishOrderEvent(orderEvent);

        res.json({
            success: true,
            data: updatedOrder,
            message: 'Order updated successfully',
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order',
        });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;

        const existingOrder = await databaseService.getOrderById(id);

        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found',
            });
            return;
        }

        if (userRole !== 'admin' && existingOrder.userId !== userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        if (existingOrder.status !== 'pending' && userRole !== 'admin') {
            res.status(400).json({
                success: false,
                error: 'Can only cancel pending orders',
            });
            return;
        }

        // Delete order
        const deleted = await databaseService.deleteOrder(id);

        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete order',
            });
            return;
        }

        const now = new Date();
        const orderEvent = {
            type: 'ORDER_CANCELLED' as const,
            orderId: id,
            userId: existingOrder.userId,
            data: existingOrder,
            timestamp: now,
        };

        await kafkaService.publishOrderEvent(orderEvent);
        await kafkaService.publishAnalyticsEvent({
            eventType: 'ORDER_CANCELLED',
            orderId: id,
            userId: existingOrder.userId,
            amount: existingOrder.totalAmount,
            status: 'cancelled',
            timestamp: now,
        });

        await rabbitMQService.publishOrderEvent(orderEvent);

        res.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
        });
    }
});

router.get('/analytics/dashboard', async (req: Request, res: Response) => {
    try {
        const analytics = await databaseService.getAnalytics();
        const recentOrders = await databaseService.getAllOrders();

        res.json({
            success: true,
            data: {
                ...analytics,
                recentOrders: recentOrders.slice(0, 10),
            },
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
        });
    }
});

export default router;