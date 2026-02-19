export interface ChannelWhatsAppTemplate {
  id: number;
  template_name: string;
  language: string;
  active: boolean;
  template_url_webhook?: string | null;
  company_id: number;
  channel_id: number;
  department_id: number;
}