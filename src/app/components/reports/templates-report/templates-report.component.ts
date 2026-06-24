import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { RouterLink } from '@angular/router';
import { CaseDashboardService } from '@app/services/case-dashboard.service';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { LanguageService } from '@app/services/extras/language.service';
import { User } from '@app/models/auth.model';

@Component({
  selector: 'app-templates-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MainLayoutComponent
  ],
  templateUrl: './templates-report.component.html',
  styleUrls: ['./templates-report.component.css']
})
export class TemplatesReportComponent implements OnInit {
  user: User | null = null;
  loading = false;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  activeTab: 'bulk' | 'individual' = 'bulk';
  
  // Data lists
  bulkSends: any[] = [];
  individualSends: any[] = [];

  // Search parameters
  bulkSearch = '';
  individualSearch = '';

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
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
          await this.loadReportData();
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async onCompanyChange(): Promise<void> {
    await this.loadReportData();
  }

  async loadReportData(): Promise<void> {
    if (!this.selectedCompanyId) return;

    this.loading = true;
    try {
      const res = await this.caseDashboardService.getTemplateReport(this.selectedCompanyId);
      if (res?.success && res.data) {
        this.bulkSends = res.data.bulk_sends || [];
        this.individualSends = res.data.individual_sends || [];
      } else {
        this.bulkSends = [];
        this.individualSends = [];
      }
    } catch (error) {
      console.error('Error loading template report:', error);
      this.bulkSends = [];
      this.individualSends = [];
    } finally {
      this.loading = false;
    }
  }

  getFilteredBulkSends(): any[] {
    if (!this.bulkSearch.trim()) return this.bulkSends;
    const query = this.bulkSearch.toLowerCase().trim();
    return this.bulkSends.filter(b => {
      const desc = (b.description || '').toLowerCase();
      const template = (b.template_name || '').toLowerCase();
      const agent = (b.agent_name || '').toLowerCase();
      return desc.includes(query) || template.includes(query) || agent.includes(query);
    });
  }

  getFilteredIndividualSends(): any[] {
    if (!this.individualSearch.trim()) return this.individualSends;
    const query = this.individualSearch.toLowerCase().trim();
    return this.individualSends.filter(i => {
      const template = (i.template_name || '').toLowerCase();
      const agent = (i.agent_name || '').toLowerCase();
      const phone = (i.client_phone || '').toLowerCase();
      const caseId = String(i.case_id);
      return template.includes(query) || agent.includes(query) || phone.includes(query) || caseId.includes(query);
    });
  }

  setActiveTab(tab: 'bulk' | 'individual'): void {
    this.activeTab = tab;
  }

  get totalBulkRecipients(): number {
    return this.bulkSends.reduce((sum, b) => sum + (b.total_recipients || 0), 0);
  }

  get totalBulkSuccessful(): number {
    return this.bulkSends.reduce((sum, b) => sum + (b.successful_sends || 0), 0);
  }

  get bulkSuccessRate(): string {
    const total = this.totalBulkRecipients;
    if (total === 0) return '0%';
    const success = this.totalBulkSuccessful;
    return ((success / total) * 100).toFixed(1) + '%';
  }

  getFilteredLast24HoursCount(): number {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.individualSends.filter(i => {
      if (!i.created_at) return false;
      const date = new Date(i.created_at);
      return date >= oneDayAgo;
    }).length;
  }

  getUniqueAgentsCount(): number {
    const agents = new Set(this.individualSends.map(i => i.agent_name).filter(Boolean));
    return agents.size;
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
