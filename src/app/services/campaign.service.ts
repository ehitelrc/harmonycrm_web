import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { Campaign } from '@app/models/campaign.model';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';

const GATEWAY = '/campaigns';
export const CAMPAIGN_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

type PartialCampaign = Partial<Campaign> & {
  // permitir snake/camel en inputs
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

@Injectable({ providedIn: 'root' })
export class CampaignService {
  constructor(private fetch: FetchService) {}

  // --- Helpers de fecha ---
  private toYMD(v?: string | Date | null): string | null {
    if (!v) return null;
    if (v instanceof Date) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // si viene ISO '2025-08-01T00:00:00Z' recorta a YYYY-MM-DD
    const s = String(v);
    return s.length >= 10 ? s.substring(0, 10) : s;
  }

  private serialize(data: PartialCampaign): any {
    const start = this.toYMD(data.start_date ?? data.startDate ?? null);
    const end   = this.toYMD(data.end_date ?? data.endDate ?? null);
    return {
      ...data,
      start_date: start,
      end_date: end,
      // evita mandar camel duplicado
      startDate: undefined,
      endDate: undefined,
    };
  }

  // --- Endpoints ---
  getByCompany(companyId: number) {
    return this.fetch.get<ApiResponse<CampaignWithFunnel[]>>({
      API_Gateway: `${CAMPAIGN_URL}/company/${companyId}`,
    });
  }

  getById(id: number) {
    return this.fetch.get<ApiResponse<CampaignWithFunnel>>({
      API_Gateway: `${CAMPAIGN_URL}/${id}`,
    });
  }

  create(data: PartialCampaign) {
    const payload = this.serialize(data);
    return this.fetch.post<ApiResponse<CampaignWithFunnel>>({
      API_Gateway: `${CAMPAIGN_URL}`,
      values: payload,
    });
  }

  update(id: number, data: PartialCampaign) {
    const payload = { ...this.serialize(data), id }; // backend espera objeto con id
    return this.fetch.put<ApiResponse<CampaignWithFunnel>>({
      API_Gateway: `${CAMPAIGN_URL}`,
      values: payload,
    });
  }

  delete(id: number) {
    return this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${CAMPAIGN_URL}/${id}`,
    });
  }


  
}