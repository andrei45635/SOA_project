import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisClientType } from 'redis';
import { authService } from '../services/auth.service';
import { redisService } from '../services/redis.service';
import { config } from '../config';
import { NotificationEvent } from '../types';

let io: Server;

export const setupWebSocket = async (
    httpServer: HttpServer,
    redisClient: RedisClientType,
    redisSubscriber: RedisClientType
): Promise<Server> => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        path: '/ws',
    });

    // Use Redis adapter for scaling WebSockets across multiple instances
    io.adapter(createAdapter(redisClient, redisSubscriber));

    console.log(`WebSocket server initialized on instance ${config.instanceId}`);

    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        try {
            const payload = authService.verifyToken(token as string);
            socket.data.user = payload;
            next();
        } catch (error) {
            next(new Error('Invalid authentication token'));
        }
    });

    io.on('connection', async (socket: Socket) => {
        const userId = socket.data.user?.userId;
        console.log(`Client connected: ${socket.id}, User: ${userId}, Instance: ${config.instanceId}`);

        if (userId) {
            await redisService.setUserSocket(userId, socket.id, config.instanceId);
            socket.join(`user:${userId}`);
        }

        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now(), instanceId: config.instanceId });
        });

        socket.on('subscribe:orders', () => {
            if (userId) {
                socket.join(`orders:${userId}`);
                console.log(`User ${userId} subscribed to order updates`);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}, User: ${userId}`);
            if (userId) {
                await redisService.removeUserSocket(userId);
            }
        });

        socket.emit('connected', {
            message: 'Connected to notification service',
            instanceId: config.instanceId,
            userId,
        });
    });

    return io;
};

export const sendNotificationToUser = (userId: string, notification: NotificationEvent): void => {
    if (!io) {
        console.error('WebSocket server not initialized');
        return;
    }

    io.to(`user:${userId}`).emit('notification', notification);
    console.log(`Sent notification to user ${userId}: ${notification.title}`);
};

export const broadcastNotification = (notification: NotificationEvent): void => {
    if (!io) {
        console.error('WebSocket server not initialized');
        return;
    }

    io.emit('notification', notification);
    console.log(`Broadcasted notification: ${notification.title}`);
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('WebSocket server not initialized');
    }
    return io;
};