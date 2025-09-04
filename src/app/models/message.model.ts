// src/app/models/message.model.ts

export type MessageSenderType = 'client' | 'agent';
export type MessageType = 'text' | 'image' | 'file' | 'audio';

export interface Message {
  id: number;
  case_id: number;

  sender_type: MessageSenderType;
  message_type: MessageType;

  text_content?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  channel_message_id?: string | null;

  created_at?: string | Date;   // el backend suele enviar ISO string; puedes convertir a Date si quieres
  base64_content?: string | null;
}

/**
 * Helpers opcionales
 */

// Crea un mensaje “vacío” (útil para formularios)
export function createEmptyMessage(caseId: number): Message {
  return {
    id: 0,
    case_id: caseId,
    sender_type: 'agent',
    message_type: 'text',
    text_content: '',
    created_at: new Date()
  };
}

// Normaliza created_at a Date si viene como string
export function normalizeMessageDates(m: Message): Message {
  const created_at =
    typeof m.created_at === 'string' ? new Date(m.created_at) : m.created_at;
  return { ...m, created_at };
}