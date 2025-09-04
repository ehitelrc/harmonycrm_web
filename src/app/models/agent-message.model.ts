// src/app/models/agent-message.model.ts
export type SenderType = 'agent' | 'client';
export type MessageType = 'text' | 'image' | 'file' | 'audio';

export interface AgentMessage {
  case_id: number;         // ID del caso
  sender_type: SenderType; // "agent" | "client"
  message_type: MessageType; // "text" | "image" | "file" | "audio"
  text_message: string;    // contenido del mensaje cuando message_type === "text"
}

export function buildAgentTextMessage(caseId: number, body: string): AgentMessage {
  return {
    case_id: caseId,
    sender_type: 'agent',
    message_type: 'text',
    text_message: body ?? '',
  };
}