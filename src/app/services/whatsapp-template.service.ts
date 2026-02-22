import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { WhatsAppTemplate } from '@app/models/whatsapp-template.model';
import { ChannelIntegrationShort } from '@app/models/channel-integration-short.model';
import { MessageTemplate } from '@app/models/message-template.model';
import { ChannelTemplateIntegration } from '@app/models/channel-template-integration.model';

const GATEWAY = '/channels';
export const TEMPLATE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

// New endpoint for the MessageTemplate CRUD
export const MSG_TEMPLATE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: '/templates',
});

@Injectable({ providedIn: 'root' })
export class WhatsAppTemplateService {
  constructor(private fetch: FetchService) { }

  async getAll(params?: { companyId?: number; channelIntegrationId?: number }): Promise<ApiResponse<WhatsAppTemplate[]>> {
    return await this.fetch.get<ApiResponse<WhatsAppTemplate[]>>({
      API_Gateway: `${TEMPLATE_URL}`,
      values: {
        ...(params?.companyId ? { companyId: params.companyId } : {}),
        ...(params?.channelIntegrationId ? { channelIntegrationId: params.channelIntegrationId } : {}),
      },
    });
  }

  async getById(id: number): Promise<ApiResponse<WhatsAppTemplate>> {
    return await this.fetch.get<ApiResponse<WhatsAppTemplate>>({ API_Gateway: `${TEMPLATE_URL}/${id}` });
  }

  async create(data: Partial<WhatsAppTemplate>): Promise<ApiResponse<WhatsAppTemplate>> {
    return await this.fetch.post<ApiResponse<WhatsAppTemplate>>({ API_Gateway: `${TEMPLATE_URL}`, values: data });
  }

  async update(id: number, data: Partial<WhatsAppTemplate>): Promise<ApiResponse<WhatsAppTemplate>> {
    data.id = id;
    return await this.fetch.put<ApiResponse<WhatsAppTemplate>>({ API_Gateway: `${TEMPLATE_URL}`, values: data });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({ API_Gateway: `${TEMPLATE_URL}/${id}` });
  }

  async getChannels(): Promise<ApiResponse<ChannelIntegrationShort[]>> {
    return await this.fetch.get<ApiResponse<ChannelIntegrationShort[]>>({
      API_Gateway: `${environment.API.BASE}/channels`,
    });
  }

  // DEPRECATED
  async getWhatsappTemplatesByIntegration(integrationId: number): Promise<ApiResponse<WhatsAppTemplate[]>> {
    return await this.fetch.get<ApiResponse<WhatsAppTemplate[]>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates/integration/${integrationId}`,
    });
  }

  async getWhatsappTemplatesByDepartment(departmentId: number): Promise<ApiResponse<WhatsAppTemplate[]>> {
    return await this.fetch.get<ApiResponse<WhatsAppTemplate[]>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates/department/${departmentId}`,
    });
  }

  async createWhatsappTemplate(data: Partial<WhatsAppTemplate>): Promise<ApiResponse<WhatsAppTemplate>> {
    return await this.fetch.post<ApiResponse<WhatsAppTemplate>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates`,
      values: data,
    });
  }

  async updateWhatsappTemplate(id: number, data: Partial<WhatsAppTemplate>): Promise<ApiResponse<WhatsAppTemplate>> {
    data.id = id;
    return await this.fetch.put<ApiResponse<WhatsAppTemplate>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates`,
      values: data,
    });
  }

  async deleteWhatsappTemplate(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates/${id}`,
    });
  }

  // ── New /templates endpoint methods ──────────────────────────────────────

  /** GET /templates/?channel_id=X — all message templates, optionally filtered by channel_id */
  async getAllTemplates(channelId?: number): Promise<ApiResponse<MessageTemplate[]>> {
    const url = channelId
      ? `${MSG_TEMPLATE_URL}/?channel_id=${channelId}`
      : `${MSG_TEMPLATE_URL}/`;
    return await this.fetch.get<ApiResponse<MessageTemplate[]>>({
      API_Gateway: url,
    });
  }

  /** POST /templates/ — create a new MessageTemplate */
  async createMessageTemplate(data: Partial<MessageTemplate>): Promise<ApiResponse<MessageTemplate>> {
    return await this.fetch.post<ApiResponse<MessageTemplate>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/`,
      values: data,
    });
  }

  /** PUT /templates/:id — update a MessageTemplate */
  async updateMessageTemplate(id: number, data: Partial<MessageTemplate>): Promise<ApiResponse<MessageTemplate>> {
    return await this.fetch.put<ApiResponse<MessageTemplate>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/${id}`,
      values: { ...data, id },
    });
  }

  /** DELETE /templates/:id — delete a MessageTemplate */
  async deleteMessageTemplate(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/${id}`,
    });
  }

  /** GET /templates/:id/integrations — all integrations with is_linked flag for the template */
  async getIntegrationsForTemplate(templateId: number): Promise<ApiResponse<ChannelTemplateIntegration[]>> {
    return await this.fetch.get<ApiResponse<ChannelTemplateIntegration[]>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/${templateId}/integrations`,
    });
  }

  /** POST /templates/integration/:integrationId — link a template to an integration */
  async assignIntegration(integrationId: number, templateId: number): Promise<ApiResponse<any>> {
    return await this.fetch.post<ApiResponse<any>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/integration/${integrationId}`,
      values: { template_id: templateId },
    });
  }

  /** GET /templates/integration/:integrationId — all templates linked to an integration */
  async getTemplatesByIntegration(integrationId: number): Promise<ApiResponse<ChannelTemplateIntegration[]>> {
    return await this.fetch.get<ApiResponse<ChannelTemplateIntegration[]>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/integration/${integrationId}`,
    });
  }

  /** DELETE /templates/integration/:integrationId?template_id=X — unlink a template from an integration */
  async unassignIntegration(integrationId: number, templateId: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${MSG_TEMPLATE_URL}/integration/${integrationId}?template_id=${templateId}`,
    });
  }
}