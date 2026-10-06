export interface DashboardStats {
  total_incidents: number;
  active_incidents: number;
  resolved_incidents: number;
  verified_incidents?: number;
  high_risk_zones?: number;
  reports_today?: number;
  avg_response_time_minutes?: number;
  total_users: number;
  incidents_by_type: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  incidents_by_status: Record<string, number>;
  recent_incidents: Array<{
    id: number;
    type: string;
    severity: string;
    status: string;
    location_name: string | null;
    created_at: string;
  }>;
  monthly_trend: Array<{
    month: string;
    count: number;
  }>;
}


export interface AnalyticsResponse {
  incidents_per_day: Array<{
    date: string;
    count: number;
  }>;
  avg_resolution_time_hours: number;
  most_affected_areas: Array<{
    location: string;
    count: number;
  }>;
  severity_distribution: Record<string, number>;
  type_distribution: Record<string, number>;
  response_rate: number;
}
