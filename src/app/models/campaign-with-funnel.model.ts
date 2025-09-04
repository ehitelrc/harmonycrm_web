// src/app/models/campaign-with-funnel.model.ts
export interface CampaignWithFunnel {
  campaign_id: number;
  company_id?: number | null;
  campaign_name: string;
  start_date?: string | null;   // ISO yyyy-mm-dd desde el backend
  end_date?: string | null;     // ISO yyyy-mm-dd
  description?: string | null;
  created_at: string;           // ISO timestamp
  is_active: boolean;
  funnel_id?: number | null;
  funnel_name?: string | null;
}