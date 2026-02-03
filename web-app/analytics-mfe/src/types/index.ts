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
  lastOrderDate: string | null;
}

export interface AnalyticsEvent {
  eventType: string;
  orderId: string;
  userId: string;
  amount?: number;
  status?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
