// src/app/services/case.service.ts
import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { Message } from '@app/models/message.model';
import { AgentMessage } from '@app/models/agent-message.model';
import { CaseNote } from '@app/models/case-notes.model';
import { CaseNoteView } from '@app/models/case-notes-view.model';
import { MoveCaseStagePayload } from '@app/models/move_case_stager_payload';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';


const GATEWAY = '/messages';
export const CASE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

export interface AssignCaseToCampaignPayload {
  case_id: number;
  campaign_id: number;
  changed_by?: number; // opcional, depende del backend
}

export interface CaseFunnelEntry {
  id: number;
  case_id: number;
  funnel_id: number | null;
  stage_id: number | null;
  stage_name?: string | null;

  note?: string | null;
  changed_by: number;
  changed_by_name?: string | null;

  changed_at: string; // ISO
  action: 'assign' | 'move' | 'unassign' | 'note';
}

export interface CaseFunnelCurrent {
  case_id: number;
  funnel_id: number | null;
  funnel_name?: string | null;
  stage_id: number | null;
  stage_name?: string | null;

  note?: string | null;
  changed_by: number;
  changed_by_name?: string | null;

  changed_at: string; // ISO
}

export type CaseFunnelAction = 'assign' | 'move' | 'unassign' | 'note';

/** Refleja la vista SQL/GORM: vw_case_current_stage */
export interface VwCaseCurrentStage {
  case_id: number;

  funnel_id: number | null;
  funnel_name: string | null;

  current_stage_id: number | null;
  current_stage_name: string | null;

  /** ISO string (viene de time.Time en Go). */
  last_changed_at: string;

  last_changed_by: number;
  last_changed_by_label: string;

  action: CaseFunnelAction;
}


@Injectable({ providedIn: 'root' })
export class CaseService {
  constructor(private fetch: FetchService) { }

  getByAgent(agentId: number) {
    return this.fetch.get<ApiResponse<CaseWithChannel[]>>({
      API_Gateway: `${CASE_URL}/entry/active_cases/${agentId}`,
    });
  }

  // case.service.ts (o donde esté declarado)
  getMessagesByCase(caseId: number) {
    return this.fetch.get<ApiResponse<Message[]>>({
      API_Gateway: `${CASE_URL}/entry/messages/${caseId}`,
    });
  }

  // Enviar mensaje de texto
  sendText(message: AgentMessage) {
    return this.fetch.post<ApiResponse<Message>>({
      API_Gateway: `${CASE_URL}/entry/send`,
      values: message,
    }).then(res => res.data);

  }

  //Assign client to case
  // Asignar un caso a un cliente
  assignCaseToClient(caseId: number, clientId: number) {
    return this.fetch.put<ApiResponse<void>>({
      API_Gateway: `${CASE_URL}/entry/assign_case`,
      values: {
        case_id: caseId,   // 👈 snake_case para que haga match con Go
        client_id: clientId
      },
    });
  }

  // GET /case-notes/by-case/:caseId
  async getByCase(caseId: number): Promise<ApiResponse<CaseNoteView[]>> {
    return await this.fetch.get<ApiResponse<CaseNoteView[]>>({
      API_Gateway: `${CASE_URL}/entry/case_notes/${caseId}`,
    });
  }

  // POST /case-notes
  async create(data: Partial<CaseNote>): Promise<ApiResponse<CaseNote>> {
    console.log(data);

    return await this.fetch.post<ApiResponse<CaseNote>>({
      API_Gateway: `${CASE_URL}/entry/case_notes`,
      values: data,
    });
  }

  // (Opcional) DELETE /case-notes/:id
  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${CASE_URL}/${id}`,
    });
  }

  // 🚀 Nuevo método: asignar caso a campaña (JSON payload)
  async assignCaseToCampaign(
    payload: AssignCaseToCampaignPayload
  ): Promise<ApiResponse<void>> {
    return await this.fetch.post<ApiResponse<void>>({
      API_Gateway: `${CASE_URL}/entry/assign_campaign`,
      values: payload,
    });
  }

  // Estado actual del funnel para el caso
  getCaseFunnelCurrent(caseId: number) {
    return this.fetch.get<ApiResponse<VwCaseCurrentStage>>({
      API_Gateway: `${CASE_URL}/entry/case_funnel/current/${caseId}`,
    });
  }

  // Historial de cambios de funnel/stage del caso
  getCaseFunnelHistory(caseId: number) {
    return this.fetch.get<ApiResponse<CaseFunnelEntry[]>>({
      API_Gateway: `${CASE_URL}/entry/case_funnel/history/${caseId}`,
    });
  }

  moveCaseStage(payload: MoveCaseStagePayload) {
    return this.fetch.post<ApiResponse<void>>({
      API_Gateway: `${CASE_URL}/entry/case_funnel/set_stage`,
      values: payload,
    });
  }

  async closeCase(caseId: number, note: string, user_id: number, funnel_id: number | null): Promise<ApiResponse<void>> {
    return await this.fetch.post<ApiResponse<void>>({
      API_Gateway: `${CASE_URL}/entry/close_case`,
      values: { case_id: caseId, note: note, closed_by: user_id, funnel_id: funnel_id },
    });
  }

  async getCaseGeneralInformation(company_id: number, campaign_id: number, stage_id: number): Promise<ApiResponse<CaseGeneralInformation[]>> {
    return await this.fetch.get<ApiResponse<CaseGeneralInformation[]>>({
      API_Gateway: `${CASE_URL}/entry/case_general_info/${company_id}/${campaign_id}/${stage_id}`,
    });
  }

}