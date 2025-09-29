import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { DashboardStats, StockAlert } from '@app/models/dashboard.model';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { DashboardCampaignPerCompany } from '@app/models/dashboard_campaign_per_company_view';
import { DashboardGeneralByCompany } from '@app/models/dashboard_general_by_company_view';
import { DashboardCampaignFunnelSummary } from '@app/models/campaign_funnel_summary_view';

const GATEWAY = '/dashboard';
export const DASHBOARD_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private fetchService: FetchService) { }

  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return await this.fetchService.get<ApiResponse<DashboardStats>>({
      API_Gateway: `${DASHBOARD_URL}/stats`,
    });
  }

  // Temporary simulated endpoints for charts and alerts until backend exists
  async getRecentActivity(): Promise<{ id: number; type: string; message: string; time: string; }[]> {
    return [
      { id: 1, type: 'completed', message: 'Tarea de recepción completada RCV-001', time: '2h' },
      { id: 2, type: 'created', message: 'Nuevo SKU agregado SKU-12453', time: '4h' },
      { id: 3, type: 'adjustment', message: 'Ajuste de stock para SKU-98765', time: '6h' },
    ];
  }

  async getMovementChartData(): Promise<{ date: string; inbound: number; outbound: number; }[]> {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - idx));
      return {
        date: d.toISOString().slice(0, 10),
        inbound: Math.floor(20 + Math.random() * 40),
        outbound: Math.floor(15 + Math.random() * 35),
      };
    });
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    return [
      { id: '1', sku: 'SKU-12453', currentStock: 3, alertLevel: 'critical' },
      { id: '2', sku: 'SKU-98765', currentStock: 8, alertLevel: 'high' },
      { id: '3', sku: 'SKU-55555', currentStock: 15, alertLevel: 'medium' },
    ];
  }

  async getCampaingsInformationByCompany(companyId: number): Promise<ApiResponse<DashboardCampaignPerCompany[]>> {
    return await this.fetchService.get<ApiResponse<DashboardCampaignPerCompany[]>>({
      API_Gateway: `${DASHBOARD_URL}/campaign/summary/company/${companyId}`,
    });
  }

  async getGeneralDashboardByCompany(companyId: number): Promise<DashboardGeneralByCompany | null> {
    const resp = await this.fetchService.get<ApiResponse<DashboardGeneralByCompany[]>>({
      API_Gateway: `${DASHBOARD_URL}/summary/company/${companyId}`,
    });

    if (resp?.success && Array.isArray(resp.data) && resp.data.length > 0) {
      return resp.data[0]; // devolvemos SOLO el objeto
    }
    return null;
  }

  // {{base_url}}/dashboard/campaign/funnel_summary/6
  async getCampaignFunnelSummaryByCompany(companyId: number): Promise<ApiResponse<DashboardCampaignFunnelSummary[]>> {
    return await this.fetchService.get<ApiResponse<DashboardCampaignFunnelSummary[]>>({
      API_Gateway: `${DASHBOARD_URL}/campaign/funnel_summary/${companyId}`,
    }); 
  }

}

