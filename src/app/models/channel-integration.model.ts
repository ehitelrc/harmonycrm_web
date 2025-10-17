// src/app/models/channel-integration.model.ts
export interface ChannelIntegration {
  id: number;
  company_id: number;
  channel_id: number;
  webhook_url: string;
  access_token?: string;
  app_identifier?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}