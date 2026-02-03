import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiService } from '../services/api.service';
import { wsService } from '../services/websocket.service';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        wsService.connect(savedToken);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    wsService.connect(response.token);
    return response;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await apiService.register(email, password, name);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    wsService.connect(response.token);
    return response;
  }, []);

  const logout = useCallback(() => {
    apiService.logout();
    wsService.disconnect();
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  return { user, loading, login, register, logout };
}
