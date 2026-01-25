import express from 'express';
import cors from 'cors';
import { config } from './config';
import { databaseService } from './services/database.service';
import { kafkaConsumerService } from './services/kafka.service';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[Analytics Service] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
    });
});

app.get('/analytics/dashboard', async (req, res) => {
    try {
        const dashboard = await databaseService.getDashboard();

        res.json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard',
        });
    }
});

app.get('/analytics/daily', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate
            ? new Date(startDate as string)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const end = endDate
            ? new Date(endDate as string)
            : new Date();

        const stats = await databaseService.getStatsByDateRange(start, end);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch daily stats',
        });
    }
});

app.get('/analytics/summary', async (req, res) => {
    try {
        const dashboard = await databaseService.getDashboard();

        res.json({
            success: true,
            data: dashboard.summary,
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary',
        });
    }
});

app.get('/analytics/top-users', async (req, res) => {
    try {
        const dashboard = await databaseService.getDashboard();

        res.json({
            success: true,
            data: dashboard.topUsers,
        });
    } catch (error) {
        console.error('Error fetching top users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top users',
        });
    }
});

app.get('/analytics/recent-events', async (req, res) => {
    try {
        const dashboard = await databaseService.getDashboard();

        res.json({
            success: true,
            data: dashboard.recentEvents,
        });
    } catch (error) {
        console.error('Error fetching recent events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent events',
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Analytics Service',
        version: '1.0.0',
        endpoints: {
            dashboard: '/analytics/dashboard',
            daily: '/analytics/daily',
            summary: '/analytics/summary',
            topUsers: '/analytics/top-users',
            recentEvents: '/analytics/recent-events',
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
        console.log('Starting Analytics Service...');

        await databaseService.connect();

        await kafkaConsumerService.connect();
        await kafkaConsumerService.subscribe();
        await kafkaConsumerService.startConsuming();

        app.listen(config.port, () => {
            console.log(`Analytics Service running on port ${config.port}`);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            await kafkaConsumerService.disconnect();
            await databaseService.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start Analytics Service:', error);
        process.exit(1);
    }
}

bootstrap();