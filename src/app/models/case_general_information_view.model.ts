export interface CaseGeneralInformation {
  case_id: number;              // ID del caso
  company_id: number;           // Compañía
  client_id?: number | null;    // Cliente (nullable)
  department_id?: number | null;// Departamento (nullable)
  campaign_id?: number | null;  // Campaña (nullable)
  agent_id?: number | null;     // Agente asignado (nullable)
  funnel_id?: number | null;    // Funnel (nullable)
  status: string;               // Estado actual
  channel_id?: number | null;   // Canal (nullable)
  sender_id?: number | null;    // Remitente (nullable)

  // Información del funnel actual
  current_stage_id?: number | null;
  current_stage_name?: string | null;
  last_changed_by_label?: string | null;
  action?: string | null;

  // Información del cliente
  client_name?: string | null;
  email?: string | null;

  // Información de campaña
  campaign_name?: string | null;

  // Información del canal
  channel_name?: string | null;
  channel_code?: string | null;

  // Información del departamento
  department_name?: string | null;

  agent_name?: string | null; // Nombre del agente asignado

  color_hex?: string | null; // Color asociado al funnel o estado
}