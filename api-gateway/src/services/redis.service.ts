import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

export class RedisService {
    private client: RedisClientType | null = null;
    private subscriber: RedisClientType | null = null;

    async connect(): Promise<{ client: RedisClientType; subscriber: RedisClientType }> {
        try {
            console.log('Connecting to Redis...');

            this.client = createClient({ url: config.redis.url });
            this.subscriber = this.client.duplicate();

            await this.client.connect();
            await this.subscriber.connect();

            console.log('Connected to Redis successfully');

            this.client.on('error', (err) => {
                console.error('Redis client error:', err);
            });

            return { client: this.client, subscriber: this.subscriber };
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    getClient(): RedisClientType {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }

    getSubscriber(): RedisClientType {
        if (!this.subscriber) {
            throw new Error('Redis subscriber not initialized');
        }
        return this.subscriber;
    }

    // Cache methods
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.client) throw new Error('Redis not connected');

        if (ttlSeconds) {
            await this.client.setEx(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.client) throw new Error('Redis not connected');
        return this.client.get(key);
    }

    async del(key: string): Promise<void> {
        if (!this.client) throw new Error('Redis not connected');
        await this.client.del(key);
    }

    // Store user's socket connection info for scaling
    async setUserSocket(userId: string, socketId: string, instanceId: string): Promise<void> {
        const key = `user:socket:${userId}`;
        const value = JSON.stringify({ socketId, instanceId, timestamp: Date.now() });
        await this.set(key, value, 3600); // 1 hour TTL
    }

    async getUserSocket(userId: string): Promise<{ socketId: string; instanceId: string } | null> {
        const key = `user:socket:${userId}`;
        const value = await this.get(key);
        if (!value) return null;
        return JSON.parse(value);
    }

    async removeUserSocket(userId: string): Promise<void> {
        await this.del(`user:socket:${userId}`);
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
        }
        if (this.subscriber) {
            await this.subscriber.quit();
        }
    }
}

export const redisService = new RedisService();