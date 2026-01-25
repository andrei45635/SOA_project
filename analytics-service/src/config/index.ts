import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3003', 10),

    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
        clientId: 'analytics-service',
        groupId: 'analytics-service-group',
    },

    database: {
        url: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/orders_db',
    },
};