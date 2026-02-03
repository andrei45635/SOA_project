import axios, { AxiosInstance } from 'axios';
import { ApiResponse, AuthResponse, Order, Notification, AnalyticsDashboard } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      name,
    });
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.error || 'Registration failed');
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.error || 'Login failed');
  }

  logout(): void {
    this.setToken(null);
    localStorage.removeItem('user');
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.client.get<ApiResponse<Order[]>>('/orders');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  }

  async getAllOrders(): Promise<Order[]> {
    const response = await this.client.get<ApiResponse<Order[]>>('/orders/admin/all');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  }

  async createOrder(items: { productId: string; productName: string; quantity: number; price: number }[]): Promise<Order> {
    const response = await this.client.post<ApiResponse<Order>>('/orders', { items });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create order');
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await this.client.put<ApiResponse<Order>>(`/orders/${id}`, { status });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update order');
  }

  async cancelOrder(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse<void>>(`/orders/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to cancel order');
    }
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get<ApiResponse<Notification[]>>('/notifications');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  }

  async getAnalytics(): Promise<AnalyticsDashboard> {
    const response = await this.client.get<ApiResponse<AnalyticsDashboard>>('/analytics/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch analytics');
  }
}

export const apiService = new ApiService();
