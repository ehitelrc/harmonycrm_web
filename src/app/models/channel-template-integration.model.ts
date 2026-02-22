// channel-template-integration.model.ts
// Matches the `vw_channel_template_integrations` view via harmony_api ChannelTemplateIntegration model

export interface ChannelTemplateIntegration {
    channel_id: number;
    channel_code: string;
    channel_name: string;
    template_id: number;
    template_name: string;
    description?: string | null;
    language_code: string;
    integration_id: number;
    integration_name: string;
    company_id: number;
    department_id?: number | null;
    is_linked: boolean;
}
