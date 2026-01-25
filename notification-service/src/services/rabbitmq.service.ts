import amqp, { Channel, Connection } from 'amqplib';
import { config } from '../config';
import { NotificationEvent, OrderEvent } from '../types';
import { redisService } from './redis.service';

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    private readonly EXCHANGES = {
        NOTIFICATIONS: 'notifications.exchange',
        ORDERS: 'orders.exchange',
    };

    private readonly QUEUES = {
        NOTIFICATIONS: 'notifications.queue',
        ORDER_NOTIFICATIONS: 'order.notifications.queue',
    };

    async connect(): Promise<void> {
        try {
            console.log('Connecting to RabbitMQ...');
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGES.NOTIFICATIONS, 'fanout', { durable: true });
            await this.channel.assertExchange(this.EXCHANGES.ORDERS, 'topic', { durable: true });

            await this.channel.assertQueue(this.QUEUES.NOTIFICATIONS, { durable: true });
            await this.channel.assertQueue(this.QUEUES.ORDER_NOTIFICATIONS, { durable: true });

            await this.channel.bindQueue(this.QUEUES.NOTIFICATIONS, this.EXCHANGES.NOTIFICATIONS, '');
            await this.channel.bindQueue(this.QUEUES.ORDER_NOTIFICATIONS, this.EXCHANGES.ORDERS, 'order.*');

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

    async startConsumingNotifications(): Promise<void> {
        if (!this.channel) {
            console.error('RabbitMQ channel not initialized');
            return;
        }
        await this.channel.consume(this.QUEUES.NOTIFICATIONS, async (msg) => {
            if (msg) {
                try {
                    const notification = JSON.parse(msg.content.toString()) as NotificationEvent;
                    console.log(`Received notification for user ${notification.userId}: ${notification.title}`);

                    // Store notification in Redis
                    await redisService.storeNotification(notification);

                    // Publish to Redis for WebSocket delivery
                    await redisService.publishNotification(notification);

                    this.channel?.ack(msg);
                } catch (error) {
                    console.error('Error processing notification:', error);
                    this.channel?.nack(msg, false, false);
                }
            }
        });

        await this.channel.consume(this.QUEUES.ORDER_NOTIFICATIONS, async (msg) => {
            if (msg) {
                try {
                    const orderEvent = JSON.parse(msg.content.toString()) as OrderEvent;
                    console.log(`Received order event: ${orderEvent.type} for order ${orderEvent.orderId}`);
                    const notification = this.createNotificationFromOrderEvent(orderEvent);
                    if (notification) {
                        await redisService.storeNotification(notification);
                        await redisService.publishNotification(notification);
                    }
                    this.channel?.ack(msg);
                } catch (error) {
                    console.error('Error processing order event:', error);
                    this.channel?.nack(msg, false, false);
                }
            }
        });

        console.log('Started consuming notifications from RabbitMQ');
    }

    private createNotificationFromOrderEvent(event: OrderEvent): NotificationEvent | null {
        switch (event.type) {
            case 'ORDER_CREATED':
                return {
                    type: 'WEBSOCKET',
                    userId: event.userId,
                    title: 'Order Placed',
                    message: `Your order #${event.orderId.slice(0, 8)} has been placed successfully!`,
                    data: { orderId: event.orderId, eventType: event.type },
                };

            case 'ORDER_UPDATED':
                const status = (event.data as any)?.status || 'updated';
                return {
                    type: 'WEBSOCKET',
                    userId: event.userId,
                    title: 'Order Updated',
                    message: `Your order #${event.orderId.slice(0, 8)} status: ${status}`,
                    data: { orderId: event.orderId, status, eventType: event.type },
                };

            case 'ORDER_CANCELLED':
                return {
                    type: 'WEBSOCKET',
                    userId: event.userId,
                    title: 'Order Cancelled',
                    message: `Your order #${event.orderId.slice(0, 8)} has been cancelled.`,
                    data: { orderId: event.orderId, eventType: event.type },
                };

            default:
                return null;
        }
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