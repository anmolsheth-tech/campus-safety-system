export interface CampusNode {
  id: string;
  name: string;
  type: 'intersection' | 'building_entrance' | 'emergency_station' | 'gate' | 'landmark';
  latitude: number;
  longitude: number;
  is_safe_zone: boolean;
  lighting_level: 'bright' | 'moderate' | 'dim' | 'dark';
  has_emergency_phone: boolean;
  has_security_camera: boolean;
}

export interface CampusEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance: number;
  pathway_type: 'paved' | 'dirt' | 'covered' | 'indoor';
  lighting_level: 'bright' | 'moderate' | 'dim' | 'dark';
  is_stairs: boolean;
  risk_score: number;
  is_accessible: boolean;
  has_emergency_lighting: boolean;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address?: string;
  building_type: string;
  floors: number;
  has_security: boolean;
  has_aed: boolean;
  has_fire_extinguisher: boolean;
  emergency_exits: number;
}

export interface EmergencyLocation {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'emergency_phone' | 'first_aid' | 'safe_zone';
  latitude: number;
  longitude: number;
  phone?: string;
  address?: string;
  is_24_7: boolean;
  building_id?: string;
}
