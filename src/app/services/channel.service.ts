import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { Channel } from '@app/models/channel.model';
import { VWChannelIntegration } from '@app/models/vw-channel-integration.model';
import { ChannelIntegration } from '@app/models/channel-integration.model';

const GATEWAY = '/channels';
export const CHANNEL_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class ChannelService {
  constructor(private fetch: FetchService) {}

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

  getWhatsappIntegrationsByCompany(company: number) : Promise<ApiResponse<VWChannelIntegration[]>>  {
    return this.fetch.get<ApiResponse<VWChannelIntegration[]>>({
      API_Gateway: `${CHANNEL_URL}/integrations/whatsapp/company/${company}`,
    });
  }

  // Get intgrations by company and channel
  getIntegrationsByCompanyAndChannel(companyId: number, channelId: number) : Promise<ApiResponse<ChannelIntegration[]>>  {
    return this.fetch.get<ApiResponse<ChannelIntegration[]>>({
      API_Gateway: `${CHANNEL_URL}/integrations/company/${companyId}/channel/${channelId}`,
    });
  }
  

  UpdateIntegration(id: number, data: Partial<ChannelIntegration>) {
    const payload = { ...data, "id": id };
    return this.fetch.put<ApiResponse<ChannelIntegration>>({
      API_Gateway: `${environment.API.BASE}/channels/integrations`,
      values: payload,
    });
  }

  CreateIntegration(data: Partial<ChannelIntegration>) {
      return this.fetch.post<ApiResponse<ChannelIntegration>>({
        API_Gateway: `${environment.API.BASE}/channels/integrations`,
      values: data,
    });
  }

  DeleteIntegration(id: number) {
    return this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${environment.API.BASE}/channels/integrations/${id}`,
    });
  }

}