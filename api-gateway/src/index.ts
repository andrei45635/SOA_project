import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config';
import { redisService } from './services/redis.service';
import { rabbitMQService } from './services/rabbitmq.service';
import { setupWebSocket, sendNotificationToUser } from './services/websocket.service';
import authRoutes from './routes/auth.routes';
import ordersRoutes from './routes/orders.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[Instance ${config.instanceId}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        instanceId: config.instanceId,
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/orders', ordersRoutes);
app.use('/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'API Gateway',
        version: '1.0.0',
        instanceId: config.instanceId,
        endpoints: {
            auth: '/auth',
            orders: '/orders',
            analytics: '/analytics',
            health: '/health',
            websocket: '/ws',
        },
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

async function bootstrap() {
    try {
        console.log(`Starting API Gateway (Instance ${config.instanceId})...`);

        const { client: redisClient, subscriber: redisSubscriber } = await redisService.connect();
        await rabbitMQService.connect();
        //todo: kinda weird
        await setupWebSocket(httpServer, redisClient as any, redisSubscriber as any);
        await rabbitMQService.subscribeToNotification((notification) => {
            console.log(`Received notification for user ${notification.userId}`);
            sendNotificationToUser(notification.userId, notification);
        });

        httpServer.listen(config.port, () => {
            console.log(`API Gateway (Instance ${config.instanceId}) running on port ${config.port}`);
            console.log(`WebSocket available at ws://localhost:${config.port}/ws`);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            await rabbitMQService.close();
            await redisService.close();
            httpServer.close(() => {
               console.log('Server closed');
               process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start API Gateway:', error);
        process.exit(1);
    }
}

bootstrap();
