import { Kafka, Producer, Partitioners } from 'kafkajs';
import { config } from '../config';
import { OrderEvent } from '../types';

class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private isConnected: boolean = false;

    private readonly TOPICS = {
        ORDER_EVENTS: 'order-events',
        ORDER_ANALYTICS: 'order-analytics',
    };

    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            retry: {
                initialRetryTime: 1000,
                retries: 10,
            },
        });

        this.producer = this.kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner,
        });
    }

    async connect(): Promise<void> {
        try {
            console.log('Connecting to Kafka...');
            await this.producer.connect();
            this.isConnected = true;
            console.log('Connected to Kafka successfully');

            const admin = this.kafka.admin();
            await admin.connect();

            const existingTopics = await admin.listTopics();
            const topicsToCreate = Object.values(this.TOPICS).filter(
                topic => !existingTopics.includes(topic)
            );

            if (topicsToCreate.length > 0) {
                await admin.createTopics({
                    topics: topicsToCreate.map(topic => ({
                        topic,
                        numPartitions: 3,
                        replicationFactor: 1,
                    })),
                });
                console.log(`Created Kafka topics: ${topicsToCreate.join(', ')}`);
            }

            await admin.disconnect();
        } catch (error) {
            console.error('Failed to connect to Kafka:', error);
            this.isConnected = false;
        }
    }

    async publishOrderEvent(event: OrderEvent): Promise<void> {
        if (!this.isConnected) {
            console.warn('Kafka not connected. Skipping event publish.');
            return;
        }

        try {
            await this.producer.send({
                topic: this.TOPICS.ORDER_EVENTS,
                messages: [
                    {
                        key: event.orderId,
                        value: JSON.stringify(event),
                        timestamp: event.timestamp.getTime().toString(),
                    },
                ],
            });

            console.log(`Published order event to Kafka: ${event.type} for order ${event.orderId}`);
        } catch (error) {
            console.error('Failed to publish order event to Kafka:', error);
        }
    }

    async publishAnalyticsEvent(data: {
        eventType: string;
        orderId: string;
        userId: string;
        amount?: number;
        status?: string;
        timestamp: Date;
    }): Promise<void> {
        if (!this.isConnected) {
            console.warn('Kafka not connected. Skipping analytics event publish.');
            return;
        }

        try {
            await this.producer.send({
                topic: this.TOPICS.ORDER_ANALYTICS,
                messages: [
                    {
                        key: data.orderId,
                        value: JSON.stringify(data),
                        timestamp: data.timestamp.getTime().toString(),
                    },
                ],
            });

            console.log(`Published analytics event to Kafka: ${data.eventType}`);
        } catch (error) {
            console.error('Failed to publish analytics event to Kafka:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
            console.log('Disconnected from Kafka');
        }
    }
}

export const kafkaService = new KafkaService();