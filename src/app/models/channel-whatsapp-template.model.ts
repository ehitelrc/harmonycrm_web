export interface ChannelWhatsAppTemplate {
  id: number;
  channel_integration: number;
  template_name: string;
  language: string;
  active: boolean;
  template_url_webhook?: string | null;
}