import api from './api';
import type { Notification } from '@/types';

export const notificationService = {
  async getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
    const params = unreadOnly ? '?unread_only=true' : '';
    const response = await api.get<Notification[]>(`/notifications${params}`);
    return response.data;
  },

  async markRead(id: string | number): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};

