import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),

    database: {
        url: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/orders_db',
    },

    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    },

    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
        clientId: 'order-service',
        groupId: 'order-service-group',
    },
};