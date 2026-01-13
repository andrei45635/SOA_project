import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    instanceId: process.env.INSTANCE_ID || '1',

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        expiresIn: '24h',
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    },

    services: {
        orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
        notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
    },
};