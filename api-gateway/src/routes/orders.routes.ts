import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { rabbitMQService } from '../services/rabbitmq.service';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${config.services.orderService}/orders`, {
            params: { userId: req.user?.userId },
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch orders',
            });
        }
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${config.services.orderService}/orders/${req.params.id}`, {
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch order',
            });
        }
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const orderData = {
            ...req.body,
            userId: req.user?.userId,
        };

        const response = await axios.post(`${config.services.orderService}/orders`, orderData, {
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        if (response.data.success && response.data.data) {
            await rabbitMQService.publishNotification({
                type: 'WEBSOCKET',
                userId: req.user?.userId || '',
                title: 'Order Created',
                message: `Your order #${response.data.data.id} has been placed successfully!`,
                data: { orderId: response.data.data.id },
            });

            // Request email notification via FaaS
            await rabbitMQService.publishEmailRequest({
                to: req.user?.email || '',
                subject: 'Order Confirmation',
                body: `Your order #${response.data.data.id} has been placed. Total: $${response.data.data.totalAmount}`,
                userId: req.user?.userId || '',
            });
        }

        res.status(201).json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create order',
            });
        }
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.put(
            `${config.services.orderService}/orders/${req.params.id}`,
            req.body,
            {
                headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
            }
        );

        if (response.data.success && response.data.data) {
            await rabbitMQService.publishNotification({
                type: 'WEBSOCKET',
                userId: req.user?.userId || '',
                title: 'Order Updated',
                message: `Your order #${req.params.id} has been updated. Status: ${response.data.data.status}`,
                data: { orderId: req.params.id, status: response.data.data.status },
            });
        }

        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update order',
            });
        }
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.delete(`${config.services.orderService}/orders/${req.params.id}`, {
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        if (response.data.success) {
            await rabbitMQService.publishNotification({
                type: 'WEBSOCKET',
                userId: req.user?.userId || '',
                title: 'Order Cancelled',
                message: `Your order #${req.params.id} has been cancelled.`,
                data: { orderId: req.params.id },
            });
        }

        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to cancel order',
            });
        }
    }
});

router.get('/admin/all', authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${config.services.orderService}/orders/all`, {
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch all orders',
            });
        }
    }
});

export default router;