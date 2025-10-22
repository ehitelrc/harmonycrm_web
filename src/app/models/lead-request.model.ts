// models/lead-request.model.ts
export interface LeadRequest {
  client_id: number;
  company_id: number;
  campaign_id: number;
  channel_id: number;
  channel_integration_id: number;
  agent_id: number;
  items: ItemSelection[];
}

export interface ItemSelection {
  item_id: number;
  item_name: string;
  quantity: number;
  item_price: number;
  notes?: string;
}