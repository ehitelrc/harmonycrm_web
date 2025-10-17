import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { WhatsAppTemplate } from '@app/models/whatsapp-template.model';
import { ChannelIntegrationShort } from '@app/models/channel-integration-short.model';

const GATEWAY = '/channels';
export const TEMPLATE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class WhatsAppTemplateService {
  constructor(private fetch: FetchService) {}

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

  async getWhatsappTemplatesByIntegration(integrationId: number): Promise<ApiResponse<WhatsAppTemplate[]>> {
    return await this.fetch.get<ApiResponse<WhatsAppTemplate[]>>({
      API_Gateway: `${TEMPLATE_URL}/whatsapp/templates/integration/${integrationId}`,
    });
  } 
}