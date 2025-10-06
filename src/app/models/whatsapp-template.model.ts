 

// models/whatsapp-template.model.ts
export interface WhatsAppTemplate {
  id: number;
  company_id: number;
  channel_integration_id: number;
  template_name: string;
  language: string;
  active: boolean;
  template_url_webhook: string | null;
 
}