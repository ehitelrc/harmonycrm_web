import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { CaseDashboardService } from '@app/services/case-dashboard.service';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { DepartmentService } from '@app/services/department.service';
import { LanguageService } from '@app/services/extras/language.service';
import { User } from '@app/models/auth.model';
import { DashboardStats } from '@app/models/dashboard-stats.model';
import { Department } from '@app/models/department.model';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { ChatWorkspaceComponent } from '../../chat/chat-workspace.component';

@Component({
  selector: 'app-cases-status-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    NgApexchartsModule,
    ChatWorkspaceComponent
  ],
  templateUrl: './cases-status-report.component.html',
  styleUrls: ['./cases-status-report.component.css']
})
export class CasesStatusReportComponent implements OnInit {
  user: User | null = null;
  loading = false;
  stats: DashboardStats | null = null;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  departments: Department[] = [];
  selectedDepartmentId: number | null = null;

  // Cases by Status Properties
  selectedStatusFilter: 'open' | 'closed' | 'unanswered' | 'all' = 'unanswered';
  caseSearch = '';
  detailCases: any[] = [];
  detailPage = 1;
  detailLimit = 10;
  detailTotalCount = 0;
  detailLoading = false;
  chatPreviewCase: any | null = null;
  startDate = '';
  endDate = '';

  // ApexCharts Config
  statusChartOptions: Partial<ApexOptions> = {};

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseDashboardService: CaseDashboardService,
    private languageService: LanguageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;

    await this.loadCompanies();
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0]?.company_id ?? null;
        if (this.selectedCompanyId) {
          await this.loadDepartments();
          await this.loadStats();
          await this.loadDetailCases();
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async loadDepartments(): Promise<void> {
    if (!this.selectedCompanyId) {
      this.departments = [];
      return;
    }
    try {
      const response = await this.departmentService.getByCompany(this.selectedCompanyId);
      if (response?.success && response.data) {
        this.departments = response.data;
      } else {
        this.departments = [];
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      this.departments = [];
    }
  }

  async onCompanyChange(): Promise<void> {
    this.selectedDepartmentId = null;
    await this.loadDepartments();
    await this.loadStats();
    await this.loadDetailCases();
  }

  async onFilterChange(): Promise<void> {
    await this.loadStats();
    await this.loadDetailCases();
  }

  async onDateFilterChange(): Promise<void> {
    this.detailPage = 1;
    await this.loadStats();
    await this.loadDetailCases();
  }

  async clearDateFilters(): Promise<void> {
    this.startDate = '';
    this.endDate = '';
    this.detailPage = 1;
    await this.loadStats();
    await this.loadDetailCases();
  }

  async onSearchChange(): Promise<void> {
    this.detailPage = 1;
    await this.loadDetailCases();
  }

  async loadStats(): Promise<void> {
    if (!this.selectedCompanyId) return;

    this.loading = true;
    try {
      let res;
      if (this.selectedDepartmentId) {
        res = await this.caseDashboardService.getByCompanyAndDepartmentID(
          this.selectedCompanyId,
          this.selectedDepartmentId,
          this.startDate,
          this.endDate
        );
      } else {
        res = await this.caseDashboardService.getByCompanyID(
          this.selectedCompanyId,
          this.startDate,
          this.endDate
        );
      }

      if (res?.success && res.data) {
        this.stats = res.data;
        this.buildCharts();
      } else {
        this.stats = null;
      }
    } catch (error) {
      console.error('Error loading case dashboard stats:', error);
      this.stats = null;
    } finally {
      this.loading = false;
    }
  }

  async setStatusFilter(status: 'open' | 'closed' | 'unanswered' | 'all'): Promise<void> {
    this.selectedStatusFilter = status;
    this.detailPage = 1;
    await this.loadDetailCases();
  }

  async onPageChange(page: number): Promise<void> {
    if (page < 1 || page > this.getTotalPages()) return;
    this.detailPage = page;
    await this.loadDetailCases();
  }

  async loadDetailCases(): Promise<void> {
    if (!this.selectedCompanyId) return;
    this.detailLoading = true;
    try {
      const res = await this.caseDashboardService.getCasesByStatus(
        this.selectedCompanyId,
        this.selectedDepartmentId,
        this.selectedStatusFilter,
        this.caseSearch,
        this.detailPage,
        this.detailLimit,
        this.startDate,
        this.endDate
      );
      if (res?.success && res.data) {
        this.detailCases = res.data.cases || [];
        this.detailTotalCount = res.data.total || 0;
      } else {
        this.detailCases = [];
        this.detailTotalCount = 0;
      }
    } catch (error) {
      console.error('Error loading detailed cases:', error);
      this.detailCases = [];
      this.detailTotalCount = 0;
    } finally {
      this.detailLoading = false;
    }
  }

  getPages(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.detailPage;
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) {
      end = maxVisible;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - maxVisible + 1;
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getTotalPages(): number {
    return Math.ceil(this.detailTotalCount / this.detailLimit);
  }

  openChatPreview(caseObj: any): void {
    this.chatPreviewCase = {
      case_id: caseObj.case_id,
      client_id: caseObj.client_id,
      client_name: caseObj.client_name,
      campaign_id: caseObj.campaign_id,
      company_id: caseObj.company_id,
      department_id: caseObj.department_id,
      agent_id: caseObj.agent_id,
      agent_assigned: caseObj.agent_assigned,
      agent_full_name: caseObj.agent_full_name,
      funnel_id: caseObj.funnel_id,
      funnel_stage: caseObj.funnel_stage,
      status: caseObj.status,
      channel_id: caseObj.channel_id,
      channel_code: caseObj.channel_code,
      channel_name: caseObj.channel_name,
      channel_description: caseObj.channel_description,
      started_at: caseObj.started_at,
      closed_at: caseObj.closed_at,
      created_at: caseObj.created_at,
      updated_at: caseObj.updated_at,
      sender_id: caseObj.sender_id,
      channel_integration_id: caseObj.channel_integration_id,
      integration_name: caseObj.integration_name,
      client_messages: caseObj.client_messages,
      unread_count: caseObj.unread_count
    };
  }

  closeChatPreview(): void {
    this.chatPreviewCase = null;
  }

  buildCharts(): void {
    if (!this.stats) return;

    const closed = this.stats.closed_cases || 0;
    const unanswered = this.stats.unanswered_cases || 0;
    const openResponded = Math.max(0, (this.stats.open_cases || 0) - unanswered);

    this.statusChartOptions = {
      series: [closed, openResponded, unanswered],
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Inter, sans-serif'
      },
      labels: ['Cerrados', 'Abiertos (Atendidos)', 'Abiertos (No Respondidos)'],
      colors: ['#10b981', '#3e66ea', '#ef4444'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`
      },
      legend: {
        position: 'bottom',
        fontSize: '12px'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => {
                  return String(closed + openResponded + unanswered);
                }
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} Casos`
        }
      }
    };
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatAvgHours(hours: number | null | undefined): string {
    if (hours === null || hours === undefined || hours === 0) return 'N/D';
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}
