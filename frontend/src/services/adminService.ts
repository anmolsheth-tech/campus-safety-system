import api from './api';
import type { DashboardStats, User } from '@/types';

export interface ActivityLog {
  id: number;
  incident_id: number;
  user_id: number;
  old_status: string | null;
  new_status: string | null;
  old_severity: string | null;
  new_severity: string | null;
  note: string | null;
  created_at: string | null;
}

export const adminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },

  async getAnalytics(): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>('/admin/analytics');
    return response.data;
  },

  async getIncidentTrends(period = '30d'): Promise<Array<{ date: string; count: number }>> {
    try {
      const response = await api.get<{ incidents_per_day?: Array<{ date: string; count: number }> }>('/admin/analytics');
      return response.data?.incidents_per_day || [];
    } catch {
      return [];
    }
  },

  async getUsers(page?: number): Promise<User[] | { items: User[]; total_pages: number }> {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },


  async updateUser(id: string, params: { role?: string; is_active?: boolean }): Promise<User> {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.append('role', params.role);
    if (params.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
    const response = await api.patch<User>(`/admin/users/${id}?${searchParams.toString()}`);
    return response.data;
  },

  async getIncidents(page = 1, perPage = 20): Promise<{ incidents: unknown[]; total: number; page: number; per_page: number }> {
    const response = await api.get(`/admin/incidents?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>('/admin/activity-logs');
    return response.data;
  },
};
