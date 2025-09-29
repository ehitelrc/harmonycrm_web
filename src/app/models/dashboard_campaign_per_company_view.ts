 export interface DashboardCampaignPerCompany {
  company_id: number;
  company_name: string;
  campaign_id: number;
  campaign_name: string;
  is_active: boolean;
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  won_cases: number;
  lost_cases: number;
  conversion_rate: number;
}