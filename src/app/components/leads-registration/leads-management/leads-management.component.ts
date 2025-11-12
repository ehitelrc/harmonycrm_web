import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LeadsListComponent } from '../leads-list/leads-list.component';
import { AuthService, LanguageService } from '@app/services';
import { CaseService } from '@app/services/case.service';
import { CompanyService } from '@app/services/company.service';
import { CampaignService } from '@app/services/campaign.service';
import { CompanyUser } from '@app/models/companies_user_view';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { LeadFormComponent } from '../leads-form/leads-form.component';
import { ChannelIntegration, ChannelIntegrationDTO } from '@app/models/channel-integration.model';
import { ChannelService } from '@app/services/channel.service';
import { Channel } from '@app/models/channel.model';
import { ConfirmationDialogComponent } from '@app/components/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-leads-management',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MainLayoutComponent,
    LeadsListComponent,
    LeadFormComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './leads-management.component.html',
  styleUrls: ['./leads-management.component.css'],
})
export class LeadsManagementComponent implements OnInit {
  companies: CompanyUser[] = [];
  campaigns: CampaignWithFunnel[] = [];
  leads: CaseWithChannel[] = [];
  channels: Channel[] = [];

  selectedCompany: number | null = null;
  selectedCampaign: number | null = null;
  selectedChannelId: number | null = null;
  selectedIntegration: number | null = null;

  loading = false;
  loggedUser: any;

  isFormOpen = false;

  integrations: ChannelIntegrationDTO[] = [];


  isLoading = false;

  // ⚠️ Diálogo de confirmación
  isConfirmDialogOpen = false;
  leadToRemove: CaseWithChannel | null = null;

  constructor(
    private auth: AuthService,
    private companyService: CompanyService,
    private campaignService: CampaignService,
    private caseService: CaseService,
    private channelService: ChannelService,
    private lang: LanguageService
  ) { }

  get t() {
    return this.lang.t.bind(this.lang);
  }

  ngOnInit(): void {
    this.loggedUser = this.auth.getCurrentUser();
    this.loadCompanies();
    this.loadChannels();
  }

  async loadChannels() {
    const r = await this.channelService.getAll();
    if (r.success) this.channels = r.data;
  }

  loadCompanies() {
    this.companyService
      .getCompaniesByUserId(this.loggedUser.user_id)
      .then((res) => (this.companies = res.data || []))
      .catch((err) => console.error(err));
  }

  onCompanyChange() {
    this.selectedCampaign = null;
    this.campaigns = [];
    this.leads = [];

    if (this.selectedCompany) {
      this.campaignService
        .getByCompany(this.selectedCompany)
        .then((res) => (this.campaigns = res.data || [])) // ✅ coincide con CampaignWithFunnel
        .catch((err) => console.error(err));
    }
  }

  onCampaignChange() {

  }

  onAddLead() {
    this.isFormOpen = true;
  }

  loadLeads() {
    this.loading = true;
    this.caseService
      .getCasesByCompanyCampaignAgent(
        this.selectedCompany!,
        this.selectedCampaign!,
        this.loggedUser.user_id,
        this.selectedIntegration!
      )
      .then((res) => (this.leads = res.data || []))
      .catch((err) => console.error('Error loading leads:', err))
      .finally(() => (this.loading = false));
  }


  onRemoveLead(c: CaseWithChannel) {
    this.leadToRemove = c;
    this.isConfirmDialogOpen = true; // 🔔 abrir el diálogo
  }
  
  onConfirmRemove() {
  if (!this.leadToRemove) return;

  // 🧹 Aquí haces el borrado real
  this.caseService
    .cancelCase(this.leadToRemove.case_id!)
    .then((res) => {
      if (res.success) {
        this.leads = this.leads.filter(l => l.case_id !== this.leadToRemove?.case_id);
      }
    })
    .catch(err => console.error('Error deleting lead:', err))
    .finally(() => {
      this.isConfirmDialogOpen = false;
      this.leadToRemove = null;
    });
}

onCancelRemove() {
  this.isConfirmDialogOpen = false;
  this.leadToRemove = null;
}
  onViewLead(c: CaseWithChannel) {
    console.log('Ver lead', c);
  }

  editingLead: CaseWithChannel | null = null;


  onEditLead(c: CaseWithChannel) {
    this.editingLead = c;
    this.isFormOpen = true;
  }

  onFormClose() {
    this.isFormOpen = false;
    this.editingLead = null;
  }

  onCreateLead() {
    this.isFormOpen = false;
    this.loadLeads();

  }

  async onChannelChange() {
    if (!this.selectedCompany) return;
    this.loadIntegrations();
  }


  async onIntegrationChange() {
    if (this.selectedCompany && this.selectedCampaign && this.selectedIntegration) {
      this.loadLeads();
    }
  }


  async loadIntegrations() {
    if (!this.selectedCompany || !this.selectedChannelId) return;
    this.isLoading = true;
    const res = await this.channelService.getIntegrationsByCompanyAndChannel(this.selectedCompany, this.selectedChannelId);
    if (res.success && res.data) this.integrations = res.data;
    this.isLoading = false;
  }


}