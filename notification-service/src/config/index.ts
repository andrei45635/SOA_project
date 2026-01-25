import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3002', 10),

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    },
};