import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { NotificationEvent, StoredNotification } from '../types';

class RedisService {
    private client: RedisClientType | null = null;
    private publisher: RedisClientType | null = null;
    private subscriber: RedisClientType | null = null;

    private readonly CHANNELS = {
        NOTIFICATIONS: 'notifications:broadcast',
        USER_NOTIFICATIONS: 'notifications:user:',
    };

    async connect(): Promise<void> {
        try {
            console.log('Connecting to Redis...');

            this.client = createClient({ url: config.redis.url });

            this.publisher = this.client.duplicate();
            this.subscriber = this.client.duplicate();

            await this.client.connect();
            await this.publisher.connect();
            await this.subscriber.connect();

            console.log('Connected to Redis successfully');

            this.client.on('error', (err) => {
                console.error('Redis client error:', err);
            });
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async publishNotification(notification: NotificationEvent): Promise<void> {
        if (!this.publisher) {
            console.error('Redis publisher not initialized');
            return;
        }
        try {
            const userChannel = `${this.CHANNELS.USER_NOTIFICATIONS}${notification.userId}`;
            await this.publisher.publish(userChannel, JSON.stringify(notification));
            await this.publisher.publish(this.CHANNELS.NOTIFICATIONS, JSON.stringify(notification));
            console.log(`Published notification to Redis for user ${notification.userId}`);
        } catch (error) {
            console.error('Failed to publish notification to Redis:', error);
        }
    }

    async subscribeToNotifications(
        callback: (notification: NotificationEvent, channel: string) => void
    ): Promise<void> {
        if (!this.subscriber) {
            console.error('Redis subscriber not initialized');
            return;
        }
        try {
            await this.subscriber.pSubscribe(
                `${this.CHANNELS.USER_NOTIFICATIONS}*`,
                (message, channel) => {
                    try {
                        const notification = JSON.parse(message) as NotificationEvent;
                        callback(notification, channel);
                    } catch (error) {
                        console.error('Failed to parse notification:', error);
                    }
                }
            );
            console.log('Subscribed to Redis notification channels');
        } catch (error) {
            console.error('Failed to subscribe to notifications:', error);
        }
    }

    async storeNotification(notification: NotificationEvent): Promise<StoredNotification> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }

        const stored: StoredNotification = {
            id: uuidv4(),
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: false,
            createdAt: new Date(),
        };

        const key = `notification:${stored.userId}:${stored.id}`;
        await this.client.setEx(key, 7 * 24 * 60 * 60, JSON.stringify(stored));
        const listKey = `notifications:${stored.userId}`;
        await this.client.lPush(listKey, stored.id);
        await this.client.lTrim(listKey, 0, 99);

        return stored;
    }

    async getUserNotifications(userId: string, limit: number = 20): Promise<StoredNotification[]> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const listKey = `notifications:${userId}`;
        const notificationIds = await this.client.lRange(listKey, 0, limit - 1);
        const notifications: StoredNotification[] = [];
        for (const id of notificationIds) {
            const key = `notification:${userId}:${id}`;
            const data = await this.client.get(key);
            if (data) {
                notifications.push(JSON.parse(data));
            }
        }
        return notifications;
    }

    async markAsRead(userId: string, notificationId: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const key = `notification:${userId}:${notificationId}`;
        const data = await this.client.get(key);
        if (!data) {
            return false;
        }
        const notification = JSON.parse(data) as StoredNotification;
        notification.read = true;
        const ttl = await this.client.ttl(key);
        if (ttl > 0) {
            await this.client.setEx(key, ttl, JSON.stringify(notification));
        }
        return true;
    }

    async getUnreadCount(userId: string): Promise<number> {
        const notifications = await this.getUserNotifications(userId, 100);
        return notifications.filter(n => !n.read).length;
    }

    async close(): Promise<void> {
        if (this.subscriber) {
            await this.subscriber.quit();
        }
        if (this.publisher) {
            await this.publisher.quit();
        }
        if (this.client) {
            await this.client.quit();
        }
    }
}

export const redisService = new RedisService();