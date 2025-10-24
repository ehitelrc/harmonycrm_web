// src/app/models/agent-message.model.ts
export type SenderType = 'agent' | 'client';
export type MessageType = 'text' | 'image' | 'file' | 'audio';

export interface AgentMessage {
  case_id: number;         // ID del caso
  sender_type: SenderType; // "agent" | "client"
  message_type: MessageType; // "text" | "image" | "file" | "audio"
  text_message: string;    // contenido del mensaje cuando message_type === "text"
  base64_content?: string; // contenido en base64 cuando message_type === "image"
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