import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '@app/services/company.service';
 import { AuthService } from '@app/services';
import { CampaignService } from '@app/services/campaign.service';
import { CampaignsListComponent } from '../campaign-list/campaign-list.component';
import { CampaignFormComponent } from '../campaign-form/campaign-form.component';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { CompanyUser } from '@app/models/companies_user_view';
import { User as UserAuthModel } from '../../../models/auth.model';

@Component({
  selector: 'app-campaign-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, CampaignsListComponent, CampaignFormComponent],
  templateUrl: './campaign-management.component.html',
  styleUrls: ['./campaign-management.component.css']
})
export class CampaignManagementComponent {
  companyId: number | null = null;

  campaigns: CampaignWithFunnel[] = [];
  isLoading = false;

  isFormOpen = false;
  selected: CampaignWithFunnel | null = null;

  isDeleteOpen = false;
  deletingId: number | null = null;
  isDeleting = false;

  loggedUser: UserAuthModel | null = null;



  companies: CompanyUser[] = [];

  constructor(
     private authService: AuthService,
    private lang: LanguageService,
    private auth: AuthorizationService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private service: CampaignService
  ) { }

  get t() { return this.lang.t.bind(this.lang); }
  isAdmin(): boolean { return true; /* o this.auth.isAdmin(); */ }

  async ngOnInit(): Promise<void> {
     this.loggedUser = this.authService.getCurrentUser();


    await this.loadCompanies();

    const paramId = this.route.snapshot.paramMap.get('companyId');
    const routeCompanyId = paramId ? Number(paramId) : null;
    this.companyId = routeCompanyId && !Number.isNaN(routeCompanyId) ? routeCompanyId : null;

    if (this.companyId) await this.load();
  }

  async loadCompanies(): Promise<void> {
    try {
      this.isLoading = true;
      const r = await this.companyService.getCompaniesByUserId(this.loggedUser?.user_id || 0);
      if (r.success && r.data) this.companies = r.data;
      else this.alert.error(this.t('company.failed_to_load'));
    } catch {
      this.alert.error(this.t('company.failed_to_load'));
    } finally {
      this.isLoading = false;
    }
  }

  async load(): Promise<void> {
    if (!this.companyId) { this.campaigns = []; return; }
    try {
      this.isLoading = true;
      const r = await this.service.getByCompany(this.companyId);
      if (r.success && r.data) {

        console.log(r.data);

        this.campaigns = r.data;
      }
      else {
        this.alert.error(this.t('campaign.failed_to_load_campaigns'));
        this.campaigns = [];
      }
    } catch {
      this.alert.error(this.t('campaign.failed_to_load_campaigns'));
      this.campaigns = [];
    } finally {
      this.isLoading = false;
    }
  }

  async onCompanyChange(_: number | null) { await this.load(); }

  backToCompanies(): void { this.router.navigate(['/companies']); }

  openCreateDialog(): void {
    if (!this.companyId) {
      this.alert.warning(this.t('campaign.select_company_first'));
      return;
    }
    this.selected = null;
    this.isFormOpen = true;
  }

  openEditDialog(c: CampaignWithFunnel) {
    this.selected = c;
    this.isFormOpen = true;
  }

  closeDialog() {
    this.isFormOpen = false;
    this.selected = null;
  }

  async onSuccess(saved: CampaignWithFunnel): Promise<void> {
    this.closeDialog();
    await this.load();
    this.alert.success(
      this.selected
        ? `${this.t('campaign.updated_successfully')} (#${saved.campaign_name})`
        : `${this.t('campaign.created_successfully')} (#${saved.campaign_name})`
    );
  }

  // Delete modal
  askDelete(c: CampaignWithFunnel) {
    if (!this.isAdmin()) return;
    this.deletingId = c.campaign_id;
    this.isDeleteOpen = true;
  }
  cancelDelete() { this.deletingId = null; this.isDeleteOpen = false; }
  async confirmDelete() {
    if (!this.deletingId) return;
    this.isDeleting = true;
    try {
      const r = await this.service.delete(this.deletingId);
      if (r.success) {
        this.alert.success(this.t('campaign.deleted_successfully'));
        await this.load();
      } else {
        this.alert.error(this.t('campaign.failed_to_delete_campaign'));
      }
    } catch {
      this.alert.error(this.t('campaign.failed_to_delete_campaign'));
    } finally {
      this.isDeleting = false;
      this.cancelDelete();
    }
  }

  // hooks
  onEdit(c: CampaignWithFunnel) { this.openEditDialog(c); }
  onRemove(c: CampaignWithFunnel) { this.askDelete(c); }
  onView(_c: CampaignWithFunnel) { }
}