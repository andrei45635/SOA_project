export interface NotificationEvent {
    type: 'EMAIL' | 'PUSH' | 'WEBSOCKET';
    userId: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface OrderEvent {
    type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED';
    orderId: string;
    userId: string;
    data: Record<string, unknown>;
    timestamp: Date;
}

export interface StoredNotification {
    id: string;
    userId: string;
    type: 'EMAIL' | 'PUSH' | 'WEBSOCKET';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}