export interface User {
    id: string;
    email: string;
    name: string;
    password?: string;
    role: 'customer' | 'admin';
    createdAt?: Date;
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

export interface CreateOrderRequest {
    userId: string;
    items: OrderItem[];
}

export interface UpdateOrderRequest {
    status?: OrderStatus;
    items?: OrderItem[];
}