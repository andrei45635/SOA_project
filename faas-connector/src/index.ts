import amqp, { Channel, Connection } from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    },
    openfaas: {
        gateway: process.env.OPENFAAS_GATEWAY || 'http://gateway:8080',
        functionName: process.env.FUNCTION_NAME || 'send-email',
    },
};

class FaaSConnector {
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    private readonly EXCHANGE = 'email.exchange';
    private readonly QUEUE = 'email.queue';
    private readonly ROUTING_KEY = 'send.email';

    async connect(): Promise<void> {
        try {
            console.log('[FaaS Connector] Connecting to RabbitMQ...');
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGE, 'direct', { durable: true });
            await this.channel.assertQueue(this.QUEUE, { durable: true });
            await this.channel.bindQueue(this.QUEUE, this.EXCHANGE, this.ROUTING_KEY);

            await this.channel.prefetch(5);

            console.log('[FaaS Connector] Connected to RabbitMQ');

            this.connection.on('close', () => {
                console.log('[FaaS Connector] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });

            this.connection.on('error', (err) => {
                console.error('[FaaS Connector] RabbitMQ error:', err);
            });
        } catch (error) {
            console.error('[FaaS Connector] Failed to connect to RabbitMQ:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async startConsuming(): Promise<void> {
        if (!this.channel) {
            console.error('[FaaS Connector] Channel not initialized');
            return;
        }

        console.log('[FaaS Connector] Starting to consume messages...');

        await this.channel.consume(this.QUEUE, async (msg) => {
            if (msg) {
                const content = msg.content.toString();
                console.log('[FaaS Connector] Received message:', content);

                try {
                    const result = await this.invokeFunction(content);
                    console.log('[FaaS Connector] Function result:', result);
                    this.channel?.ack(msg);
                } catch (error) {
                    console.error('[FaaS Connector] Function invocation failed:', error);
                    this.channel?.nack(msg, false, true);
                }
            }
        });

        console.log('[FaaS Connector] Consuming from queue:', this.QUEUE);
    }

    private async invokeFunction(payload: string): Promise<unknown> {
        const url = config.openfaas.functionName
            ? `${config.openfaas.gateway}/function/${config.openfaas.functionName}`
            : config.openfaas.gateway;

        console.log(`[FaaS Connector] Invoking function at ${url}`);

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        return response.data;
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

async function main() {
    console.log('[FaaS Connector] Starting...');
    console.log(`[FaaS Connector] OpenFaaS Gateway: ${config.openfaas.gateway}`);
    console.log(`[FaaS Connector] Function: ${config.openfaas.functionName}`);

    const connector = new FaaSConnector();

    await connector.connect();
    await connector.startConsuming();

    process.on('SIGTERM', async () => {
        console.log('[FaaS Connector] Shutting down...');
        await connector.close();
        process.exit(0);
    });
}

main().catch(console.error);