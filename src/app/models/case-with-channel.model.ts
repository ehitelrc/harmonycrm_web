// models/case-with-channel.model.ts
export interface CaseWithChannel {
  case_id: number;

  client_id?: number | null;
  client_name?: string | null;

  campaign_id?: number | null;
  company_id?: number | null;
  department_id?: number | null;
  agent_id?: number | null;

  funnel_id?: number | null;
  funnel_stage?: string | null;
  status?: 'open' | 'in_progress' | 'closed' | 'cancelled' | string;

  channel_id?: string | null;
  channel_code?: string | null;
  channel_name?: string | null;
  channel_description?: string | null;

  started_at?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sender_id?: string | null;

  // 👇 Campos que necesita la UI
  unread_count?: number;
 


  last_message_id?: number | null;
  last_message_sender_type?: 'client'|'agent' | null;
  last_message_type?: 'text'|'image'|'audio'|'file' | null;
  last_message_text?: string | null;
  last_message_file_url?: string | null;
  last_message_mime_type?: string | null;
  last_message_at?: string | null;

  last_message_preview?: string | null;   // '[Imagen]', '[Audio]', '[Archivo]' o texto
  last_message_is_media?: boolean | null; // true si image/audio/file

  is_non_commercial?: boolean | null; // true si es un caso no comercial
}