import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { CompanyUser } from '@app/models/companies_user_view';
import { AuthService, LanguageService } from '@app/services';
import { CompanyService } from '@app/services/company.service';
import { CampaignService } from '@app/services/campaign.service';
import { AlertService } from '@app/services/extras/alert.service';
import { User as UserAuthModel } from '@app/models/auth.model';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { CompanyChannelTemplateView } from '@app/models/company-channel-template-view.model';
import { CampaignWhatsappPushLeadInput, CampaignWhatsappPushRequest } from '@app/models/campaign-whatsapp-push.model';
import { CampaignPushService } from '@app/services/campaign-push.service';
import { ChannelService } from '@app/services/channel.service';
import Papa from 'papaparse';
import { Department } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';
import { AgentDepartmentAssignment } from '@app/models/agent_department_assignment_view';
import { AgentUserService } from '@app/services/agent-user.service';
import { VWChannelIntegration } from '@app/models/vw-channel-integration.model';
import { ChannelTemplateIntegration } from '@app/models/channel-template-integration.model';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';

@Component({
  selector: 'app-whatsapp-push-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './whatsapp-push-management.component.html',
  styleUrls: ['./whatsapp-push-management.component.css'],
})
export class WhatsappPushManagementComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Sesión
  loggedUser: UserAuthModel | null = null;

  // Listas y selección
  companies: CompanyUser[] = [];
  campaigns: CampaignWithFunnel[] = [];
  templates: ChannelTemplateIntegration[] = [];
  departments: Department[] = [];
  assignedDepartments: AgentDepartmentAssignment[] = [];


  selectedCompany: number | null = null;
  selectedCampaign: number | null = null;
  selectedTemplate: number | null = null;
  selectedDepartment: number | null = null;

  integrations: VWChannelIntegration[] = [];
  selectedIntegration: VWChannelIntegration | null = null;

  // Form fields
  description = '';
  leads: CampaignWhatsappPushLeadInput[] = [];

  // Client catalog modal state
  isAddClientModalOpen = false;
  clientSearchQuery = '';
  clientSearchResults: Client[] = [];
  selectedCatalogClient: Client | null = null;
  manualPhone = '';
  manualCountryCode = '506'; // Default country code
  manualFullName = '';

  // Drag state
  isDragOver = false;

  // UI state
  loadingCompanies = false;
  campaignLoading = false;
  templateLoading = false;
  submitting = false;

  constructor(
    private auth: AuthService,
    private i18n: LanguageService,
    private companyService: CompanyService,
    private campaignService: CampaignService,
    private pushService: CampaignPushService,
    private channelService: ChannelService,
    private departmentService: DepartmentService,
    private agentUserService: AgentUserService,
    private alert: AlertService,
    private whatsappTemplateService: WhatsAppTemplateService,
    private clientService: ClientService,
  ) { }

  get t() {
    return this.i18n.t.bind(this.i18n);
  }

  ngOnInit(): void {
    this.loggedUser = this.auth.getCurrentUser();
    this.loadCompanies();
  }

  // === Carga de datos ===
  loadCompanies() {
    this.loadingCompanies = true;
    const userId = this.loggedUser?.user_id!;
    this.companyService.getCompaniesByUserId(userId)
      .then(resp => this.companies = resp?.data || [])
      .catch(err => console.error('Error loading companies:', err))
      .finally(() => this.loadingCompanies = false);
  }

  loadDepartments() {
    this.agentUserService.companiesDepartments(this.selectedCompany!, this.loggedUser?.user_id!)
      .then(resp => this.assignedDepartments = resp?.data || [])
      .catch(err => console.error('Error loading departments:', err));
  }

  loadIntegrationsForDepartment(departmentId: number) {
    this.channelService.getWhatsappIntegrationsByDepartment(departmentId)
      .then(resp => {
        this.integrations = resp?.data || [];
        console.log('Integrations loaded:', this.integrations);
      })
      .catch(err => console.error('Error loading WhatsApp integrations:', err));
  }

  async onIntegrationChange() {
    this.selectedTemplate = null;
    this.templates = [];

    if (!this.selectedIntegration) return;

    try {
      this.templateLoading = true;
      const res = await this.whatsappTemplateService.getTemplatesByIntegration(this.selectedIntegration.channel_integration_id);
      const data = Array.isArray(res?.data) ? res.data : [];
      this.templates = data.filter(t => t.is_linked);
    } catch (error) {
      console.error('Error loading integration templates:', error);
    } finally {
      this.templateLoading = false;
    }
  }

  onCompanySelected() {
    if (!this.selectedCompany) {
      this.campaigns = [];
      this.templates = [];
      this.integrations = [];
      this.selectedCampaign = null;
      this.selectedTemplate = null;
      this.selectedIntegration = null;
      this.selectedDepartment = null;
      return;
    }

    this.loadDepartments();
    this.loadCampaignsForCompany(this.selectedCompany);

  }

  onDepartmentSelected() {
    this.integrations = [];
    this.selectedIntegration = null;
    this.templates = [];
    this.selectedTemplate = null;

    if (this.selectedDepartment) {
      this.loadIntegrationsForDepartment(this.selectedDepartment);
      // Templates are now loaded when an integration is selected
    }
  }

  loadCampaignsForCompany(companyId: number) {
    this.campaignLoading = true;
    this.campaignService.getByCompany(companyId)
      .then(resp => this.campaigns = resp?.data || [])
      .catch(err => console.error('Error loading campaigns:', err))
      .finally(() => this.campaignLoading = false);
  }


  // Templates are now loaded via onIntegrationChange() using WhatsAppTemplateService

  // ======================
  //   CSV PROCESSING
  // ======================

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.parseCsvFile(file);

    // 🔥 Reset input para permitir subir el MISMO archivo nuevamente
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private parseCsvFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data as any[];

        this.leads = parsed
          .filter(r => r.phone_number)
          .map(r => ({
            phone_number: r.phone_number.trim(),
            full_name: r.full_name?.trim() || undefined,
          }));

        if (this.leads.length === 0) {
          this.alert.info('No se encontraron leads válidos en el CSV.');
        } else {
          console.log('Leads cargados:', this.leads);
        }
      },
      error: () => {
        this.alert.error('No se pudo leer el archivo CSV.');
      }
    });
  }

  // ======================
  //   DRAG & DROP
  // ======================

  handleDragOver(evt: DragEvent) {
    evt.preventDefault();
    this.isDragOver = true;
  }

  handleDragLeave(evt: DragEvent) {
    evt.preventDefault();
    this.isDragOver = false;
  }

  handleDrop(evt: DragEvent) {
    evt.preventDefault();
    this.isDragOver = false;

    const file = evt.dataTransfer?.files?.[0];
    if (!file) return;

    this.parseCsvFile(file);

    // Reset input para permitir recargar el mismo archivo
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  removeLead(i: number) {
    this.leads.splice(i, 1);
  }

  clearLeads() {
    this.leads = [];
  }

  // === Envío ===
  canSend(): boolean {

    return !!this.selectedCompany;
    // return !!this.selectedCompany &&
    //        !!this.selectedTemplate &&
    //        !!this.description.trim() &&
    //        this.leads.length > 0 &&
    //        !this.submitting;
  }

  async sendPush() {
    if (!this.canSend()) return;

    this.submitting = true;

    console.log(this.selectedIntegration);


    const payload: CampaignWhatsappPushRequest = {
      campaign_id: this.selectedCampaign!,
      description: this.description.trim(),
      template_id: this.selectedTemplate!,
      department_id: this.selectedDepartment!,
      channel_integration_id: this.selectedIntegration!.channel_integration_id,
      changed_by: this.loggedUser?.user_id || 0,
      leads: this.leads.map(l => ({
        phone_number: l.phone_number,
        full_name: l.full_name?.trim() || undefined,
      })),
    };

    console.log(payload);


    try {
      const resp = await this.pushService.createWhatsappPush(payload);

      if (resp?.success) {
        this.alert.success(`Push creado correctamente (ID: ${resp.data?.push_id ?? '—'})`);
      } else {
        this.alert.error(resp?.message || 'No se pudo registrar el push.');
      }

    } catch (e) {
      this.alert.error('Error al registrar el push.');
    } finally {
      this.submitting = false;
    }
  }

  async searchCatalogClients() {
    const q = this.clientSearchQuery.trim();
    if (!q) {
      this.clientSearchResults = [];
      return;
    }
    try {
      const res = await this.clientService.getAll();
      const list = Array.isArray(res?.data) ? res.data : [];
      this.clientSearchResults = list.filter((c: Client) =>
        (c.full_name || '').toLowerCase().includes(q.toLowerCase()) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q.toLowerCase())
      );
    } catch (err) {
      console.error('Error searching clients:', err);
    }
  }

  selectCatalogClient(c: Client) {
    this.selectedCatalogClient = c;
    this.manualFullName = c.full_name || '';
    
    const raw = (c.phone || '').replace(/^\+/, '').replace(/\s+/g, '');
    if (!raw) return;

    if (raw.startsWith(this.manualCountryCode)) {
      this.manualPhone = raw.slice(this.manualCountryCode.length);
    } else {
      if (raw.length > 8) {
        this.manualCountryCode = raw.slice(0, raw.length - 8);
        this.manualPhone = raw.slice(raw.length - 8);
      } else {
        this.manualPhone = raw;
      }
    }
  }

  addClientToList() {
    const phone = `${this.manualCountryCode}${this.manualPhone}`.trim();
    if (!phone) {
      this.alert.error('El número de teléfono es obligatorio.');
      return;
    }

    this.leads.push({
      phone_number: phone,
      full_name: this.manualFullName.trim() || undefined
    });

    this.closeAddClientModal();
  }

  closeAddClientModal() {
    this.isAddClientModalOpen = false;
    this.clientSearchQuery = '';
    this.clientSearchResults = [];
    this.selectedCatalogClient = null;
    this.manualPhone = '';
    this.manualFullName = '';
  }

  openAddClientModal() {
    if (!this.selectedCompany) {
      this.alert.info('Por favor, seleccione primero una empresa.');
      return;
    }
    this.isAddClientModalOpen = true;
  }
}