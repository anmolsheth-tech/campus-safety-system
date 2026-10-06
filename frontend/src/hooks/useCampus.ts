import { useQuery } from '@tanstack/react-query';
import { campusService } from '@/services/campusService';

export function useNodes() {
  return useQuery({
    queryKey: ['campus-nodes'],
    queryFn: () => campusService.getNodes(),
  });
}

export function useEdges() {
  return useQuery({
    queryKey: ['campus-edges'],
    queryFn: () => campusService.getEdges(),
  });
}

export function useBuildings() {
  return useQuery({
    queryKey: ['campus-buildings'],
    queryFn: () => campusService.getBuildings(),
  });
}

export function useEmergencyLocations() {
  return useQuery({
    queryKey: ['emergency-locations'],
    queryFn: () => campusService.getEmergencyLocations(),
  });
}
