export interface OrderEvent {
    type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED';
    orderId: string;
    userId: string;
    data: Record<string, unknown>;
    timestamp: Date;
}

export interface AnalyticsEvent {
    eventType: string;
    orderId: string;
    userId: string;
    amount?: number;
    status?: string;
    timestamp: Date;
}

export interface DailyStats {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    cancelledOrders: number;
    averageOrderValue: number;
}

export interface UserStats {
    userId: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: Date | null;
}

export interface AnalyticsDashboard {
    summary: {
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        cancelledOrders: number;
        cancellationRate: number;
    };
    dailyStats: DailyStats[];
    topUsers: UserStats[];
    ordersByStatus: Record<string, number>;
    recentEvents: AnalyticsEvent[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}