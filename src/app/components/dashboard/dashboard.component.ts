import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { User } from '../../models/auth.model';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats } from '../../models/dashboard.model';
import { LanguageService } from '../../services/extras/language.service';
import { KpiCardsComponent } from './kpi-cards/kpi-cards.component';
import { ActivityFeedComponent } from './widgets/activity-feed/activity-feed.component';
import { MovementChartComponent } from './widgets/movement-chart/movement-chart.component';
import { StockAlertsWidgetComponent } from './widgets/stock-alerts/stock-alerts-widget.component';
import { CompanyService } from '@app/services/company.service';
import { FormsModule } from '@angular/forms';
import { DashboardCampaignPerCompany } from '@app/models/dashboard_campaign_per_company_view';
import { DashboardGeneralByCompany } from '@app/models/dashboard_general_by_company_view';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    KpiCardsComponent,
 
 
    // ActivityFeedComponent,
    // MovementChartComponent,
    // StockAlertsWidgetComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  stats: DashboardGeneralByCompany | null = null;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  campaigns: DashboardCampaignPerCompany[] = [];


  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private languageService: LanguageService,
    private companyService: CompanyService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      //this.router.navigate(['/login']);
      return;
    }
    await this.loadCompanies();

  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0]?.company_id ?? null; // preselecciona la primera
        if (this.selectedCompanyId) {
          await this.loadCampaignsData(this.selectedCompanyId);
          await this.loadStats();
        }
      }
    } catch (error) {
      console.error('Error loading companies', error);
    }
  }


  onCompanyChange(event: Event): void {
    this.loadCampaignsData(this.selectedCompanyId!);
    this.loadStats();
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, we'll be redirected to login
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
      this.stats = stats; // 👈 ya es DashboardGeneralByCompany | null
    } catch (error) {
      console.error('Error loading dashboard stats', error);
    }
  }

  t(key: string): string { return this.languageService.t(key); }
}
