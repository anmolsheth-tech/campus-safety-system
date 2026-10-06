import api from './api';
import type { RouteRequest, RouteResponse, RouteComparison } from '@/types';

export const routeService = {
  async getRecommendedRoute(data: RouteRequest): Promise<RouteResponse> {
    const response = await api.post<RouteResponse>('/routes/recommend', data);
    return response.data;
  },

  async getShortestRoute(data: RouteRequest): Promise<RouteResponse> {
    const params = new URLSearchParams({
      origin_lat: String(data.origin_lat),
      origin_lon: String(data.origin_lon),
      dest_lat: String(data.dest_lat),
      dest_lon: String(data.dest_lon),
    });
    const response = await api.get<RouteResponse>(`/routes/shortest?${params.toString()}`);
    return response.data;
  },

  async getSafestRoute(data: RouteRequest): Promise<RouteResponse> {
    const params = new URLSearchParams({
      origin_lat: String(data.origin_lat),
      origin_lon: String(data.origin_lon),
      dest_lat: String(data.dest_lat),
      dest_lon: String(data.dest_lon),
    });
    const response = await api.get<RouteResponse>(`/routes/safest?${params.toString()}`);
    return response.data;
  },

  async compareRoutes(data: RouteRequest): Promise<RouteComparison> {
    const response = await api.post<RouteComparison>('/routes/compare', data);
    return response.data;
  },

  async getRouteExplanation(routeId: string): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>(`/routes/${routeId}/explanation`);
    return response.data;
  },
};

