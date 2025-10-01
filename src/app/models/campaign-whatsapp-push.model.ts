export interface CampaignWhatsappPushLeadInput {
  phone_number: string;
  full_name?: string | null;
  client_id?: number | null;
  case_id?: number | null;
  message_sent?: boolean;
}

export interface CampaignWhatsappPushRequest {
  campaign_id: number;
  description: string;
  template_id: number;
  changed_by: number;
  leads: CampaignWhatsappPushLeadInput[];
}