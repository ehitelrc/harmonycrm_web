export interface Lead {
  id: number;
  company_id: number;
  campaign_id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at?: string;
}