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
