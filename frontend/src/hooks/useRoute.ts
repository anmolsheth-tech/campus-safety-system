import { useQuery, useMutation } from '@tanstack/react-query';
import { routeService } from '@/services/routeService';
import type { RouteRequest } from '@/types';

export function useRecommendedRoute() {
  return useMutation({
    mutationFn: (data: RouteRequest) => routeService.getRecommendedRoute(data),
  });
}

export function useShortestRoute() {
  return useMutation({
    mutationFn: (data: RouteRequest) => routeService.getShortestRoute(data),
  });
}

export function useSafestRoute() {
  return useMutation({
    mutationFn: (data: RouteRequest) => routeService.getSafestRoute(data),
  });
}

export function useCompareRoutes() {
  return useMutation({
    mutationFn: (data: RouteRequest) => routeService.compareRoutes(data),
  });
}

export function useRouteExplanation(routeId: string) {
  return useQuery({
    queryKey: ['route-explanation', routeId],
    queryFn: () => routeService.getRouteExplanation(routeId),
    enabled: !!routeId,
  });
}
