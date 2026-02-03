import axios, { AxiosInstance } from 'axios';
import { ApiResponse, AnalyticsDashboard } from '../types';

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

  async getAnalytics(): Promise<AnalyticsDashboard> {
    const response = await this.client.get<ApiResponse<AnalyticsDashboard>>('/analytics/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch analytics');
  }
}

export const apiService = new ApiService();
