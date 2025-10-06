// vw-channel-integration.model.ts

export interface VWChannelIntegration {
  channel_integration_id: number;
  company_id: number;
  channel_id: number;
  channel_name: string;
  webhook_url: string;
  access_token?: string | null;
  app_identifier?: string | null;
  is_active: boolean;
  created_at: string; // viene de PostgreSQL como timestamp → string ISO
  updated_at: string; // idem
}