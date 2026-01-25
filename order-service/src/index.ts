import express from 'express';
import cors from 'cors';
import { config } from './config';
import { databaseService } from './services/database.service';
import { kafkaService } from './services/kafka.service';
import { rabbitMQService } from './services/rabbitmq.service';
import ordersRoutes from './routes/orders.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[Order Service] ${req.method} ${req.path}`);
    next();
});

app.use('/orders', ordersRoutes);

app.use('/analytics', ordersRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'order-service',
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Order Service',
        version: '1.0.0',
        endpoints: {
            orders: '/orders',
            analytics: '/analytics/dashboard',
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
        await databaseService.connect();
        await kafkaService.connect();
        await rabbitMQService.connect();

        app.listen(config.port, () => {
            console.log('Order Service running on port ', config.port);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM Received. Shutting down...');
            await kafkaService.disconnect();
            await rabbitMQService.close();
            await databaseService.close();
            process.exit(0);
        })
    } catch (error) {
        console.error('Failed to start Order Service', error);
        process.exit(1);
    }
}

bootstrap();