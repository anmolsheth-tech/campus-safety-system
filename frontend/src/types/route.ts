export interface RouteRequest {
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  route_type?: string;
}

export interface RouteResponse {
  total_distance: number;
  total_time: number;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  path_nodes: number[];
  path_coordinates: [number, number][];
  explanation?: {
    summary?: string;
    reasons?: string[];
    shortest_comparison?: string;
    risk_factors?: string[];
  };
  alternative_available: boolean;
}

export interface RouteComparison {
  shortest: RouteResponse;
  safest: RouteResponse;
  recommended: RouteResponse;
  summary: string;
}
