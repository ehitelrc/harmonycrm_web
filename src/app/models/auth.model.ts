// Authentication related models and interfaces

export interface User {
  user_id: number;
  user_name: string;
  email: string;
  role: string;
  is_super_user?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  company_id: number
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthData {
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions?: string[];
  is_super_user?: boolean;
}

// Form validation interfaces
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// JWT Token payload interface
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role?: string;
  iat: number; // issued at
  exp: number; // expires at
}

export interface UserPermission {
  permission_code: string;
  description?: string;
}
