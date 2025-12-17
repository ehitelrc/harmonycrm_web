// src/app/models/channel-integration.model.ts
export interface ChannelIntegration {
  id: number;
  company_id: number;
  channel_id: number;
  integration_name: string;
  webhook_url: string;
  access_token?: string;
  app_identifier?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  is_non_commercial?: boolean;
  department_id?: number;
  analyze_incoming_images?: boolean;
}

export interface ChannelIntegrationDTO {
  channel_integration_id: number;
  company_id: number;
  channel_id: number;
  integration_name: string;
  webhook_url: string;
  access_token?: string;
  app_identifier?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  is_non_commercial?: boolean;
  department_id?: number | null; // <-- permitir null
  department_name?: string;
  analyze_incoming_images?: boolean;
}