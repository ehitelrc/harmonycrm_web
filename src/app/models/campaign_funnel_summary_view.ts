export interface DashboardCampaignFunnelSummary {
  campaign_id: number;
  campaign_name: string;
  company_id: number;
  funnel_id: number;
  funnel_name: string;
  stage_id: number;
  stage_name: string;
  stage_code: string | null;
  position: number;
  color_hex: string | null;
  is_won: boolean;
  is_lost: boolean;
  is_terminal: boolean;
  total_cases: number;
}