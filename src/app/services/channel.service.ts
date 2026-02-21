import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { Channel } from '@app/models/channel.model';
import { VWChannelIntegration } from '@app/models/vw-channel-integration.model';
import { ChannelIntegration, ChannelIntegrationDTO } from '@app/models/channel-integration.model';
import { CompanyChannelTemplateView } from '@app/models/company-channel-template-view.model';
import { ChannelWhatsAppTemplate } from '@app/models/channel-whatsapp-template.model';

const GATEWAY = '/channels';
export const CHANNEL_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class ChannelService {
  constructor(private fetch: FetchService) { }

  getAll() {
    return this.fetch.get<ApiResponse<Channel[]>>({
      API_Gateway: `${CHANNEL_URL}`,
    });
  }

  getById(id: number) {
    return this.fetch.get<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}/${id}`,
    });
  }

  create(data: Partial<Channel>) {
    return this.fetch.post<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}`,
      values: data,
    });
  }

  // PUT recibe el objeto completo con id
  update(id: number, data: Partial<Channel>) {
    const payload = { ...data, id };
    return this.fetch.put<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}`,
      values: payload,
    });
  }

  delete(id: number) {
    return this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${CHANNEL_URL}/${id}`,
    });
  }


  // CompanyChannelTemplateView
  getWhatsappTemplatesByCompany(company: number) {
    return this.fetch.get<ApiResponse<any[]>>({
      API_Gateway: `${CHANNEL_URL}/whatsapp/templates/company/${company}`,
    });
  }

  getWhatsappIntegrationsByCompany(company: number): Promise<ApiResponse<VWChannelIntegration[]>> {
    return this.fetch.get<ApiResponse<VWChannelIntegration[]>>({
      API_Gateway: `${CHANNEL_URL}/integrations/whatsapp/company/${company}`,
    });
  }

  getWhatsappIntegrationsByDepartment(department_id: number): Promise<ApiResponse<VWChannelIntegration[]>> {
    console.log(`${CHANNEL_URL}/integrations/whatsapp/department/${department_id}`);
    return this.fetch.get<ApiResponse<VWChannelIntegration[]>>({
      API_Gateway: `${CHANNEL_URL}/integrations/whatsapp/department/${department_id}`,
    });
  }

  // Get intgrations by company and channel
  getIntegrationsByCompanyAndChannel(companyId: number, channelId: number): Promise<ApiResponse<ChannelIntegrationDTO[]>> {
    return this.fetch.get<ApiResponse<ChannelIntegrationDTO[]>>({
      API_Gateway: `${CHANNEL_URL}/integrations/company/${companyId}/channel/${channelId}`,
    });
  }


  UpdateIntegration(id: number, data: Partial<ChannelIntegrationDTO>) {
    const payload = { ...data, "id": id };
    return this.fetch.put<ApiResponse<ChannelIntegrationDTO>>({
      API_Gateway: `${environment.API.BASE}/channels/integrations`,
      values: payload,
    });
  }

  CreateIntegration(data: Partial<ChannelIntegrationDTO>) {
    return this.fetch.post<ApiResponse<ChannelIntegrationDTO>>({
      API_Gateway: `${environment.API.BASE}/channels/integrations`,
      values: data,
    });
  }

  DeleteIntegration(id: number) {
    return this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${environment.API.BASE}/channels/integrations/${id}`,
    });
  }

  ///channels/whatsapp/templates/integration/:channel_integration_id
  getWhatsappTemplatesByIntegration(integrationId: number): Promise<ApiResponse<ChannelWhatsAppTemplate[]>> {
    return this.fetch.get<ApiResponse<ChannelWhatsAppTemplate[]>>({
      API_Gateway: `${CHANNEL_URL}/whatsapp/templates/integration/${integrationId}`,
    });
  }

  getWhatsappTemplatesByDepartmentId(departmentId: number): Promise<ApiResponse<ChannelWhatsAppTemplate[]>> {
    return this.fetch.get<ApiResponse<ChannelWhatsAppTemplate[]>>({
      API_Gateway: `${CHANNEL_URL}/whatsapp/templates/department/${departmentId}`,
    });
  }

  ///templates/channel/1
  getTemplatesByChannel(channelId: number): Promise<ApiResponse<ChannelWhatsAppTemplate[]>> {
    return this.fetch.get<ApiResponse<ChannelWhatsAppTemplate[]>>({
      API_Gateway: `${CHANNEL_URL}/templates/channel/${channelId}`,
    });
  }

  // Get by integration id
  getTemplatesByIntegrationId(integrationId: number): Promise<ApiResponse<ChannelWhatsAppTemplate>> {
    console.log(`${CHANNEL_URL}/whatsapp/templates/integration/${integrationId}`);
    return this.fetch.get<ApiResponse<ChannelWhatsAppTemplate>>({
      API_Gateway: `${CHANNEL_URL}/whatsapp/templates/integration/${integrationId}`,
    });
  }

}