export enum IncidentType {
  THEFT = 'theft',
  ASSAULT = 'assault',
  HARASSMENT = 'harassment',
  FIRE = 'fire',
  MEDICAL = 'medical',
  STRUCTURAL = 'structural',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  VANDALISM = 'vandalism',
  OTHER = 'other',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  VERIFIED = 'verified',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  location_name?: string;
  building?: string;
  floor?: string;
  reporter_id: string;
  reporter_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  verified_by?: string;
  verified_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: Severity;
  latitude: number;
  longitude: number;
  location_name?: string;
  building?: string;
  floor?: string;
}
