import { Injectable } from '@angular/core';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { ApiResponse } from '@app/models';
import { CompanyChannelTemplateView } from '@app/models/company-channel-template-view.model';
import { CampaignWhatsappPushRequest } from '@app/models/campaign-whatsapp-push.model';

const BASE = returnCompleteURI({ URI: environment.API.BASE, API_Gateway: '' });

@Injectable({ providedIn: 'root' })
export class CampaignPushService {
  constructor(private fetch: FetchService) {}

  // Ajusta el endpoint a tu routing real si difiere
  getCompanyTemplates(companyId: number) {
    return this.fetch.get<ApiResponse<CompanyChannelTemplateView[]>>({
      API_Gateway: `${BASE}/channels/templates/company/${companyId}`,
    });
  }

  // Ajusta el endpoint a tu routing real si difiere
  createWhatsappPush(payload: CampaignWhatsappPushRequest) {
    return this.fetch.post<ApiResponse<{ push_id: number }>>({
      API_Gateway: `${BASE}campaigns/whatsapp/push/register`,
      values: payload,
    });
  }
}