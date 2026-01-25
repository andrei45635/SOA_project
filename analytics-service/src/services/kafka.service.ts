import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config';
import { AnalyticsEvent, OrderEvent } from '../types';
import { databaseService } from './database.service';

class KafkaConsumerService {
    private kafka: Kafka;
    private consumer: Consumer;
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

        this.consumer = this.kafka.consumer({
            groupId: config.kafka.groupId,
        });
    }

    async connect(): Promise<void> {
        try {
            console.log('Connecting Kafka consumer...');
            await this.consumer.connect();
            this.isConnected = true;
            console.log('Kafka consumer connected successfully');
        } catch (error) {
            console.error('Failed to connect Kafka consumer:', error);
            this.isConnected = false;
        }
    }

    async subscribe(): Promise<void> {
        if (!this.isConnected) {
            console.warn('Kafka consumer not connected. Skipping subscription.');
            return;
        }

        try {
            await this.consumer.subscribe({
                topics: [this.TOPICS.ORDER_EVENTS, this.TOPICS.ORDER_ANALYTICS],
                fromBeginning: false,
            });

            console.log(`Subscribed to Kafka topics: ${Object.values(this.TOPICS).join(', ')}`);
        } catch (error) {
            console.error('Failed to subscribe to Kafka topics:', error);
        }
    }

    async startConsuming(): Promise<void> {
        if (!this.isConnected) {
            console.warn('Kafka consumer not connected. Skipping consumption.');
            return;
        }

        try {
            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    await this.processMessage(payload);
                },
            });

            console.log('Kafka consumer started processing messages');
        } catch (error) {
            console.error('Failed to start Kafka consumer:', error);
        }
    }

    private async processMessage(payload: EachMessagePayload): Promise<void> {
        const { topic, partition, message } = payload;

        if (!message.value) {
            console.warn('Received empty message');
            return;
        }

        try {
            const value = message.value.toString();
            const data = JSON.parse(value);

            console.log(`Processing message from ${topic} [partition ${partition}]`);

            if (topic === this.TOPICS.ORDER_EVENTS) {
                await this.processOrderEvent(data as OrderEvent);
            } else if (topic === this.TOPICS.ORDER_ANALYTICS) {
                await this.processAnalyticsEvent(data as AnalyticsEvent);
            }
        } catch (error) {
            console.error('Error processing Kafka message:', error);
        }
    }

    private async processOrderEvent(event: OrderEvent): Promise<void> {
        console.log(`Processing order event: ${event.type} for order ${event.orderId}`);

        const analyticsEvent: AnalyticsEvent = {
            eventType: event.type,
            orderId: event.orderId,
            userId: event.userId,
            amount: (event.data as any)?.totalAmount,
            status: (event.data as any)?.status,
            timestamp: new Date(event.timestamp),
        };
        await databaseService.storeEvent(analyticsEvent);
        if (event.type === 'ORDER_CREATED') {
            const amount = (event.data as any)?.totalAmount || 0;
            await databaseService.updateDailyStats(new Date(event.timestamp), amount, false);
            await databaseService.updateUserStats(event.userId, amount, new Date(event.timestamp));
        } else if (event.type === 'ORDER_CANCELLED') {
            await databaseService.updateDailyStats(new Date(event.timestamp), 0, true);
        }

        console.log(`Processed order event: ${event.type}`);
    }

    private async processAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        console.log(`Processing analytics event: ${event.eventType} for order ${event.orderId}`);
        await databaseService.storeEvent(event);
        if (event.eventType === 'ORDER_CREATED') {
            await databaseService.updateDailyStats(new Date(event.timestamp), event.amount || 0, false);
            await databaseService.updateUserStats(event.userId, event.amount || 0, new Date(event.timestamp));
        } else if (event.eventType === 'ORDER_CANCELLED') {
            await databaseService.updateDailyStats(new Date(event.timestamp), 0, true);
        }
        console.log(`Processed analytics event: ${event.eventType}`);
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.consumer.disconnect();
            this.isConnected = false;
            console.log('Kafka consumer disconnected');
        }
    }
}

export const kafkaConsumerService = new KafkaConsumerService();