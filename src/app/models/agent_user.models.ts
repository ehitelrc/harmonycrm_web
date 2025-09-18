export interface AgentUser {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  created_at: string; // o Date si lo conviertes en el service
  updated_at: string; // o Date si lo conviertes en el service
  profile_image_url: string;
  is_agent: boolean;
}