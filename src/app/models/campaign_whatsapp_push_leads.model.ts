// src/app/models/campaign_whatsapp_push_leads.model.ts

export interface CampaignWhatsappPushLead {
  id: number;
  push_id: number;
  phone_number: string;
  client_id?: number | null; // puede ser null
  case_id?: number | null;   // puede ser null
  message_sent: boolean;
}