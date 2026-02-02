import amqp from 'amqplib';
import { config } from '../config';
import { EmailRequest } from '../types';
import { emailService } from './email.service';

class RabbitMQService {
    private connection = null;
    private channel = null;

    private readonly EXCHANGES = {
        EMAIL: 'email.exchange',
    };

    private readonly QUEUES = {
        EMAIL: 'email.queue',
    };

    async connect(): Promise<void> {
        try {
            console.log('[Email FaaS] Connecting to RabbitMQ...');
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGES.EMAIL, 'direct', { durable: true });
            await this.channel.assertQueue(this.QUEUES.EMAIL, { durable: true });
            await this.channel.bindQueue(this.QUEUES.EMAIL, this.EXCHANGES.EMAIL, 'send.email');

            await this.channel.prefetch(10);

            console.log('[Email FaaS] Connected to RabbitMQ successfully');

            this.connection.on('close', () => {
                console.log('[Email FaaS] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });

            this.connection.on('error', (err) => {
                console.error('[Email FaaS] RabbitMQ connection error:', err);
            });
        } catch (error) {
            console.error('[Email FaaS] Failed to connect to RabbitMQ:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async startConsuming(): Promise<void> {
        if (!this.channel) {
            console.error('[Email FaaS] RabbitMQ channel not initialized');
            return;
        }

        await this.channel.consume(this.QUEUES.EMAIL, async (msg) => {
            if (msg) {
                try {
                    const emailRequest = JSON.parse(msg.content.toString()) as EmailRequest;
                    console.log(`[Email FaaS] Received email request for ${emailRequest.to}`);

                    await emailService.sendEmail(emailRequest);

                    this.channel?.ack(msg);
                } catch (error) {
                    console.error('[Email FaaS] Error processing email request:', error);
                    this.channel?.nack(msg, false, false);
                }
            }
        });

        console.log('[Email FaaS] Started consuming email requests');
    }

    async publishEmail(request: EmailRequest): Promise<void> {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        this.channel.publish(
            this.EXCHANGES.EMAIL,
            'send.email',
            Buffer.from(JSON.stringify(request)),
            { persistent: true }
        );

        console.log(`[Email FaaS] Published email request for ${request.to}`);
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