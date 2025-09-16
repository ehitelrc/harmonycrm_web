import { Observable } from "rxjs";

// API Response Models
export interface Envelope {
  transaction_type: string;
  encrypted: boolean;
  encryption_type: string;
}

export interface Result {
  success: boolean;
  message: string;
  endpoint_code: string;
}

// export interface ApiResponse<T = any> {
//   envelope: Envelope;
//   result: Result;
//   data: T;
// }

// api-response.model.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ActionResponse<T = any> extends ApiResponse<T> { }

// Fetch Models
export interface Fetch {
  URI?: string;
  API_Gateway: string;
  values?: Object;
}

export interface UploadFiles {
  URI?: string;
  API_Gateway: string;
  data?: FormData;
}

export type FetchResponseT<T> = Observable<string | T | {}>;

// Auth Models
export interface LoginRequest {
  company_id: number; // Nullable for optional company selection
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// export interface AuthData {
//   token: string;
// }

export interface AuthData {
  user_id: number;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  company_id: number;
  company_name: string;
  token: string;
}


export interface User {
  user_id: number;
  user_name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions?: string[];
}


