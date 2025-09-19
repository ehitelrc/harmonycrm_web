export interface Role {
  id: number;
  name: string;
  description?: string;
  is_agent: boolean;
  created_at: string;   // ISO string desde backend
  updated_at: string;   // ISO string desde backend
}