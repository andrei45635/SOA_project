import { io, Socket } from 'socket.io-client';
import { Notification } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8083';

type NotificationCallback = (notification: Notification) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      path: '/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.socket?.emit('subscribe:orders');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      this.listeners.forEach(callback => callback(notification));
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket welcome:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
