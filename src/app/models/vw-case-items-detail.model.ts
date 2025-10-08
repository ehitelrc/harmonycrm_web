export interface VwCaseItemsDetail {
  case_item_id: number;
  case_id: number;
  item_id: number;
  company_id?: number;
  department_id?: number;
  campaign_id?: number;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  item_name: string;
  item_description?: string;
  item_type: string;
  price: number;
  quantity: number;
  total_amount: number;
  acquired: boolean;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string; // ISO 8601 timestamp
  case_status?: string;
  funnel_stage?: string;
  started_at?: string;
  closed_at?: string;
}