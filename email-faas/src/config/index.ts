import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3004', 10),

    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    },

    email: {
        from: process.env.EMAIL_FROM || 'noreply@orderapp.com',
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
    },
};