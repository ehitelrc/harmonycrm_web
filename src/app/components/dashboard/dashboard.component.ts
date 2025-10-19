import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { User } from '../../models/auth.model';
import { DashboardService } from '../../services/dashboard.service';
import { LanguageService } from '../../services/extras/language.service';
import { CompanyService } from '@app/services/company.service';
import { FormsModule } from '@angular/forms';
import { DashboardCampaignPerCompany } from '@app/models/dashboard_campaign_per_company_view';
import { DashboardGeneralByCompany } from '@app/models/dashboard_general_by_company_view';
import { KpiCardsComponent } from './kpi-cards/kpi-cards.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    KpiCardsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardGeneralByCompany | null = null;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  campaigns: DashboardCampaignPerCompany[] = [];
  private intervalId: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private languageService: LanguageService,
    private companyService: CompanyService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;

    await this.loadCompanies();

    // 🔄 Refresca cada 30 segundos
    this.intervalId = setInterval(async () => {
      if (this.selectedCompanyId) {
        await this.refreshDashboardData();
      }
    }, 30000); // 30 segundos
  }

  ngOnDestroy(): void {
    // 🧹 Limpieza del intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async refreshDashboardData(): Promise<void> {
    await Promise.all([
      this.loadCampaignsData(this.selectedCompanyId!),
      this.loadStats()
    ]);
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0]?.company_id ?? null;
        if (this.selectedCompanyId) {
          await this.refreshDashboardData();
        }
      }
    } catch (error) {
      console.error('Error loading companies', error);
    }
  }

  onCompanyChange(event: Event): void {
    if (this.selectedCompanyId) {
      this.refreshDashboardData();
    }
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async loadCampaignsData(companyId: number) {
    try {
      const response = await this.dashboardService.getCampaingsInformationByCompany(companyId);
      if (response?.success && response.data) {
        this.campaigns = response.data;
      }
    } catch (error) {
      console.error('Error loading campaigns', error);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const stats = await this.dashboardService.getGeneralDashboardByCompany(this.selectedCompanyId!);
      this.stats = stats;
    } catch (error) {
      console.error('Error loading dashboard stats', error);
    }
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}