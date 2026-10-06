import api from './api';
import type { Incident, IncidentCreate, PaginatedResponse } from '@/types';

export interface IncidentFilters {
  incident_type?: string;
  severity?: string;
  incident_status?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

export const incidentService = {
  async getIncidents(filters?: IncidentFilters): Promise<PaginatedResponse<Incident>> {
    const params = new URLSearchParams();
    if (filters) {
      const normalizedFilters = { ...filters };
      if (normalizedFilters.status && !normalizedFilters.incident_status) {
        normalizedFilters.incident_status = normalizedFilters.status;
      }
      Object.entries(normalizedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<any>(`/incidents?${params.toString()}`);
    const data = response.data;
    const rawItems: Incident[] = data?.items || data?.incidents || [];
    const perPage = data?.per_page || 20;
    const total = data?.total ?? rawItems.length;
    return {
      items: rawItems,
      total,
      page: data?.page || 1,
      per_page: perPage,
      total_pages: data?.total_pages || Math.max(1, Math.ceil(total / perPage)),
    };
  },


  async getIncident(id: string): Promise<Incident> {
    const response = await api.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  async createIncident(data: IncidentCreate): Promise<Incident> {
    const response = await api.post<Incident>('/incidents', data);
    return response.data;
  },

  async updateIncident(id: string, data: Partial<IncidentCreate & { severity: string; status: string }>): Promise<Incident> {
    if (data.severity) {
      return this.updateSeverity(id, data.severity);
    }
    if (data.status === 'resolved') {
      return this.resolveIncident(id);
    }
    if (data.status === 'rejected') {
      return this.rejectIncident(id);
    }
    if (data.status === 'verified') {
      return this.verifyIncident(id);
    }
    const response = await api.patch<Incident>(`/incidents/${id}`, data);
    return response.data;
  },

  async verifyIncident(id: string, note?: string): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}/verify`, {
      is_verified: true,
      note: note || 'Incident verified',
    });
    return response.data;
  },

  async resolveIncident(id: string): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}/resolve`);
    return response.data;
  },

  async rejectIncident(id: string): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}/reject`);
    return response.data;
  },

  async updateSeverity(id: string, severity: string, note?: string): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}/severity`, {
      severity,
      note: note || '',
    });
    return response.data;
  },

  async predictSeverity(data: { incident_type: string; description: string; latitude?: number; longitude?: number }): Promise<{
    recommended_severity: string;
    confidence: number;
    probabilities: Record<string, number>;
    factors: string[];
  }> {
    const response = await api.post('/incidents/predict-severity', data);
    return response.data;
  },

  async triggerSOS(data: { latitude: number; longitude: number; location_name?: string; description?: string }): Promise<Incident> {
    const response = await api.post<Incident>('/sos/trigger', data);
    return response.data;
  },
};

