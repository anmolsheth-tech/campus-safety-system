import api from './api';
import type { CampusNode, CampusEdge, Building, EmergencyLocation } from '@/types';

export const campusService = {
  async getNodes(): Promise<CampusNode[]> {
    const response = await api.get<CampusNode[]>('/campus/nodes');
    return response.data;
  },

  async getEdges(): Promise<CampusEdge[]> {
    const response = await api.get<CampusEdge[]>('/campus/edges');
    return response.data;
  },

  async getBuildings(): Promise<Building[]> {
    const response = await api.get<Building[]>('/campus/buildings');
    return response.data;
  },

  async getEmergencyLocations(): Promise<EmergencyLocation[]> {
    const response = await api.get<EmergencyLocation[]>('/campus/emergency-locations');
    return response.data;
  },
};
