export interface Campaign {
  id: number;
  company_id: number | null;
  name: string;
  start_date?: string | null; // ISO yyyy-MM-dd
  end_date?: string | null;   // ISO yyyy-MM-dd
  description?: string | null;
  funnel_id: number | null;
  is_active: boolean;
}