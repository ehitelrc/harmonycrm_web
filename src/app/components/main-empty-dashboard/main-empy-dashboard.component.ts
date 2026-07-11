import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { DashboardService } from '@app/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './main-empy-dashboard.component.html',
  standalone: true,
  imports: [
    MainLayoutComponent,
    CommonModule,
    FormsModule
  ]
})
export class MainEmptyDashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;
  
  // Stats
  total: number = 0;
  read: number = 0;
  delivered: number = 0;
  sent: number = 0;
  failed: number = 0;
  failedDetails: any[] = [];
  
  // UI States
  loading: boolean = false;
  showFailedModal: boolean = false;
  private intervalId: any = null;

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadCompanies();

    // 🔄 Refrescar cada 15 segundos
    this.intervalId = setInterval(async () => {
      if (this.selectedCompanyId) {
        await this.loadStatusData(this.selectedCompanyId);
      }
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user.user_id);
      if (response?.success && response.data) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0]?.company_id ?? null;
        if (this.selectedCompanyId) {
          await this.loadStatusData(this.selectedCompanyId);
        }
      }
    } catch (error) {
      console.error('Error cargando empresas', error);
    }
  }

  async loadStatusData(companyId: number): Promise<void> {
    this.loading = true;
    try {
      const response = await this.dashboardService.getMessageStatusSummary(companyId);
      if (response?.success && response.data) {
        const d = response.data;
        this.total = d.total || 0;
        this.read = d.read || 0;
        this.delivered = d.delivered || 0;
        this.sent = d.sent || 0;
        this.failed = d.failed || 0;
        this.failedDetails = d.failed_details || [];
      }
    } catch (error) {
      console.error('Error cargando estadísticas de mensajes', error);
    } finally {
      this.loading = false;
    }
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.loadStatusData(this.selectedCompanyId);
    }
  }

  openFailedModal(): void {
    if (this.failed > 0) {
      this.showFailedModal = true;
    }
  }

  closeFailedModal(): void {
    this.showFailedModal = false;
  }

  goToCase(caseId: number): void {
    this.closeFailedModal();
    this.router.navigate(['/conversations'], { queryParams: { caseId: caseId } });
  }

  getSuccessPercentage(): number {
    if (this.total === 0) return 0;
    return Math.round(((this.read + this.delivered) / this.total) * 100);
  }

  getPendingPercentage(): number {
    if (this.total === 0) return 0;
    return Math.round((this.sent / this.total) * 100);
  }

  getFailedPercentage(): number {
    if (this.total === 0) return 0;
    return Math.round((this.failed / this.total) * 100);
  }
}