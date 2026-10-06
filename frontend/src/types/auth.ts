export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin' | 'security';
  phone?: string;
  student_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  student_id?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
