import amqp from 'amqplib';
import { config } from '../config';
import { OrderEvent } from '../types';

class RabbitMQService {
    //@ts-ignore
    private connection: amqp.ChannelModel;
    //@ts-ignore
    private channel: amqp.Channel;

    private readonly EXCHANGES = {
        ORDERS: 'orders.exchange',
    };

    async connect(): Promise<void> {
        try {
            console.log('Connecting to RabbitMQ...');
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGES.ORDERS, 'topic', { durable: true });

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
            console.warn('RabbitMQ channel not initialized. Skipping publish.');
            return;
        }

        const routingKey = `order.${event.type.toLowerCase().replace('order_', '')}`;

        this.channel.publish(
            this.EXCHANGES.ORDERS,
            routingKey,
            Buffer.from(JSON.stringify(event)),
            { persistent: true }
        );

        console.log(`Published order event to RabbitMQ: ${event.type}`);
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