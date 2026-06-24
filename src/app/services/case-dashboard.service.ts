import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
 
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { DashboardCampaignPerCompany } from '@app/models/dashboard_campaign_per_company_view';
import { DashboardGeneralByCompany } from '@app/models/dashboard_general_by_company_view';
import { DashboardCampaignFunnelSummary } from '@app/models/campaign_funnel_summary_view';
import { DashboardStats } from '@app/models/dashboard-stats.model';

const GATEWAY = '/case_dashboard';
export const DASHBOARD_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({
  providedIn: 'root',
})
export class CaseDashboardService {
  constructor(private fetchService: FetchService) { }

  async getByCompanyID(companyId: number): Promise<ApiResponse<DashboardStats>> {
    return await this.fetchService.get<ApiResponse<DashboardStats>>({
      API_Gateway: `${DASHBOARD_URL}/company/${companyId}`,
    });
  }

  async getByCompanyAndDepartmentID(companyId: number, departmentId: number): Promise<ApiResponse<DashboardStats>> {
    return await this.fetchService.get<ApiResponse<DashboardStats>>({
      API_Gateway: `${DASHBOARD_URL}/company/${companyId}/department/${departmentId}`,
    });
  }

  async getCasesByStatus(
    companyId: number,
    departmentId: number | null,
    status: string,
    search: string = '',
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{ cases: any[]; total: number; page: number; limit: number }>> {
    let query = `status=${status}&page=${page}&limit=${limit}`;
    if (departmentId) {
      query += `&department_id=${departmentId}`;
    }
    if (search) {
      query += `&search=${encodeURIComponent(search)}`;
    }
    return await this.fetchService.get<ApiResponse<{ cases: any[]; total: number; page: number; limit: number }>>({
      API_Gateway: `${DASHBOARD_URL}/company/${companyId}/cases?${query}`,
    });
  }
  async getTemplateReport(companyId: number): Promise<ApiResponse<any>> {
    const reportURL = returnCompleteURI({
      URI: environment.API.BASE,
      API_Gateway: `/reports/templates/company/${companyId}`,
    });
    return await this.fetchService.get<ApiResponse<any>>({
      API_Gateway: reportURL,
    });
  }
}

