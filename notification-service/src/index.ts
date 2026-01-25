import express from 'express';
import cors from 'cors';
import { config } from './config';
import { redisService } from './services/redis.service';
import { rabbitMQService } from './services/rabbitmq.service';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[Notification Service] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
    });
});

app.get('/notifications', async (req, res) => {
    try {
        const userId = req.query.userId as string || req.headers['x-user-id'] as string;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!userId) {
            res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
            return;
        }

        const notifications = await redisService.getUserNotifications(userId, limit);

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
        });
    }
});

app.get('/notifications/unread-count', async (req, res) => {
    try {
        const userId = req.query.userId as string || req.headers['x-user-id'] as string;

        if (!userId) {
            res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
            return;
        }

        const count = await redisService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unread count',
        });
    }
});

app.put('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.userId as string || req.headers['x-user-id'] as string;

        if (!userId) {
            res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
            return;
        }

        const success = await redisService.markAsRead(userId, id);

        if (!success) {
            res.status(404).json({
                success: false,
                error: 'Notification not found',
            });
            return;
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
        });
    }
});

app.post('/notifications/test', async (req, res) => {
    try {
        const { userId, title, message } = req.body;

        if (!userId || !title || !message) {
            res.status(400).json({
                success: false,
                error: 'userId, title, and message are required',
            });
            return;
        }

        const notification = {
            type: 'WEBSOCKET' as const,
            userId,
            title,
            message,
            data: { test: true },
        };

        const stored = await redisService.storeNotification(notification);
        await redisService.publishNotification(notification);

        res.json({
            success: true,
            data: stored,
            message: 'Test notification sent',
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification',
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Notification Service',
        version: '1.0.0',
        endpoints: {
            notifications: '/notifications',
            unreadCount: '/notifications/unread-count',
            markAsRead: '/notifications/:id/read',
            test: '/notifications/test',
            health: '/health',
        },
    });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

async function bootstrap() {
    try {
        console.log('Starting Notification Service...');

        await redisService.connect();
        await redisService.subscribeToNotifications((notification, channel) => {
            console.log(`Redis notification on ${channel}: ${notification.title}`);
        });

        await rabbitMQService.connect();
        await rabbitMQService.startConsumingNotifications();

        app.listen(config.port, () => {
            console.log(`Notification Service running on port ${config.port}`);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            await rabbitMQService.close();
            await redisService.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start Notification Service:', error);
        process.exit(1);
    }
}

bootstrap();