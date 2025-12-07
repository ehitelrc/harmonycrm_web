// src/app/models/agent-message.model.ts
export type SenderType = 'agent' | 'client';
export type MessageType = 'text' | 'image' | 'file' | 'audio';

export interface AgentMessage {
  case_id: number;         // ID del caso
  sender_type: SenderType; // "agent" | "client"
  message_type: MessageType; // "text" | "image" | "file" | "audio"
  text_message: string;    // contenido del mensaje cuando message_type === "text"
  base64_content?: string; // contenido en base64 cuando message_type === "image"
  mime_type?: string;    // tipo MIME del archivo cuando message_type === "file" o "audio"
  file_name?: string;   // nombre del archivo cuando message_type === "file"
 
}

export function buildAgentTextMessage(caseId: number, body: string): AgentMessage {
  return {
    case_id: caseId,
    sender_type: 'agent',
    message_type: 'text',
    text_message: body ?? '',
  };
}


export function buildAgentImageMessage(caseId: number, body: string, base64Content: string): AgentMessage {
  return {
    case_id: caseId,
    sender_type: 'agent',
    message_type: 'image',
    text_message: body ?? '',
    base64_content: base64Content ?? '',
  
  }; 
}

export function buildAgentFileMessage(
  caseId: number,
  fileName: string,
  base64Content: string,
  mime: string
): AgentMessage {
  return {
    case_id: caseId,
    sender_type: 'agent',
    message_type: 'file',
    text_message: fileName ?? '',     // WhatsApp usa esto como caption opcional
    base64_content: base64Content ?? '',
    mime_type: mime ?? '',
    file_name: fileName ?? ''
  };
}