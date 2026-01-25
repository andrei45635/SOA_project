export interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderEvent {
    type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED';
    orderId: string;
    userId: string;
    data: Partial<Order>;
    timestamp: Date;
}

export interface NotificationEvent {
    type: 'EMAIL' | 'PUSH' | 'WEBSOCKET';
    userId: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: 'customer' | 'admin';
    iat?: number;
    exp?: number;
}

export interface KafkaOrderMessage {
    key: string;
    value: OrderEvent;
    timestamp: string;
}

export interface OrderAnalytics {
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: Record<OrderStatus, number>;
    recentOrders: Order[];
}