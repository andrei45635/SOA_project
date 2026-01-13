import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        // In a real app, this would call the analytics service
        // For now, we'll return mock data or proxy to analytics service
        const response = await axios.get(`${config.services.orderService}/analytics/dashboard`, {
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        res.json(response.data);
    } catch (error) {
        // If analytics service is not available, return mock data
        res.json({
            success: true,
            data: {
                totalOrders: 0,
                totalRevenue: 0,
                ordersByStatus: {
                    pending: 0,
                    confirmed: 0,
                    preparing: 0,
                    ready: 0,
                    delivered: 0,
                    cancelled: 0,
                },
                recentOrders: [],
            },
        });
    }
});

router.get('/orders-by-date', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const response = await axios.get(`${config.services.orderService}/analytics/orders-by-date`, {
            params: { startDate, endDate },
            headers: { 'x-user-id': req.user?.userId, 'x-user-role': req.user?.role },
        });

        res.json(response.data);
    } catch (error) {
        res.json({
            success: true,
            data: [],
        });
    }
});

export default router;