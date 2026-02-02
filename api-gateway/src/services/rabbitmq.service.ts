import amqp from 'amqplib';
import { config } from '../config';
import { NotificationEvent, OrderEvent } from '../types';

export class RabbitMQService {
    private connection = null;
    private channel = null;

    private readonly EXCHANGES = {
        ORDERS: 'orders.exchange',
        NOTIFICATIONS: 'notifications.exchange',
        EMAIL: 'email.exchange',
    };

    private readonly QUEUES = {
        ORDER_CREATED: 'order.created.queue',
        ORDER_UPDATED: 'order.updated.queue',
        NOTIFICATIONS: 'notifications.queue',
        EMAIL: 'email.queue',
    };

    async connect(): Promise<void> {
        try {
            console.log('Connecting to RabbitMQ...');
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGES.ORDERS, 'topic', { durable: true });
            await this.channel.assertExchange(this.EXCHANGES.NOTIFICATIONS, 'fanout', { durable: true });
            await this.channel.assertExchange(this.EXCHANGES.EMAIL, 'direct', { durable: true });

            await this.channel.assertQueue(this.QUEUES.ORDER_CREATED, { durable: true });
            await this.channel.assertQueue(this.QUEUES.ORDER_UPDATED, { durable: true });
            await this.channel.assertQueue(this.QUEUES.NOTIFICATIONS, { durable: true });
            await this.channel.assertQueue(this.QUEUES.EMAIL, { durable: true });

            await this.channel.bindQueue(this.QUEUES.ORDER_CREATED, this.EXCHANGES.ORDERS, 'order.created');
            await this.channel.bindQueue(this.QUEUES.ORDER_UPDATED, this.EXCHANGES.ORDERS, 'order.updated');
            await this.channel.bindQueue(this.QUEUES.NOTIFICATIONS, this.EXCHANGES.NOTIFICATIONS, '');
            await this.channel.bindQueue(this.QUEUES.EMAIL, this.EXCHANGES.EMAIL, 'send.email');

            console.log('Connected to RabbitMQ successfully');

            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });

            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
            });
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async publishOrderEvent(event: OrderEvent): Promise<void> {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        const routingKey = event.type === 'ORDER_CREATED' ? 'order.created' : 'order.updated';

        this.channel.publish(
            this.EXCHANGES.ORDERS,
            routingKey,
            Buffer.from(JSON.stringify(event)),
            { persistent: true }
        );

        console.log(`Published order event: ${event.type} for order ${event.orderId}`);
    }

    async publishNotification(notification: NotificationEvent): Promise<void> {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        this.channel.publish(
            this.EXCHANGES.NOTIFICATIONS,
            '',
            Buffer.from(JSON.stringify(notification)),
            { persistent: true }
        );

        console.log(`Published notification for user ${notification.userId}`);
    }

    async publishEmailRequest(emailData: {
        to: string;
        subject: string;
        body: string;
        userId: string;
    }): Promise<void> {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        this.channel.publish(
            this.EXCHANGES.EMAIL,
            'send.email',
            Buffer.from(JSON.stringify(emailData)),
            { persistent: true }
        );

        console.log(`Published email request to ${emailData.to}`);
    }

    async subscribeToNotifications(callback: (notification: NotificationEvent) => void): Promise<void> {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        await this.channel.consume(this.QUEUES.NOTIFICATIONS, (msg) => {
            if (msg) {
                const notification = JSON.parse(msg.content.toString()) as NotificationEvent;
                callback(notification);
                this.channel?.ack(msg);
            }
        });

        console.log('Subscribed to notifications queue');
    }

    async close(): Promise<void> {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
}

export const rabbitMQService = new RabbitMQService();