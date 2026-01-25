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
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'PUSH' | 'WEBSOCKET';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
