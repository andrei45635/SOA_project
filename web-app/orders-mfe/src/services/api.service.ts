import axios, { AxiosInstance } from 'axios';
import { ApiResponse, Order } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.client.get<ApiResponse<Order[]>>('/orders');
    return response.data.success && response.data.data ? response.data.data : [];
  }

  async getAllOrders(): Promise<Order[]> {
    const response = await this.client.get<ApiResponse<Order[]>>('/orders/admin/all');
    return response.data.success && response.data.data ? response.data.data : [];
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
}

export const apiService = new ApiService();
