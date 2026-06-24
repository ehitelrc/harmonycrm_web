// message-template.model.ts
// Matches the `message_templates` table via harmony_api MessageTemplate model

export interface MessageTemplate {
  id: number;
  channel_id: number;
  template_name: string;
  language_code: string;
  description?: string;
  category?: string;
  is_active: boolean;
  is_conversation_starter: boolean;
  linked_count: number;
  meta_template_id?: string;
  meta_category?: string;
  approval_status?: string;
  rejection_reason?: string;
  body_content?: string;
  header_content?: string;
  footer_content?: string;
  buttons_json?: string;
  created_at?: string;
  updated_at?: string;
}

