import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { Channel } from '@app/models/channel.model';
import { ChannelService } from '@app/services/channel.service';
import Papa from 'papaparse';
@Component({
  selector: 'app-whatsapp-push-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './whatsapp-push-management.component.html',
  styleUrls: ['./whatsapp-push-management.component.css'],
})
export class WhatsappPushManagementComponent implements OnInit {
  // Sesión
  loggedUser: UserAuthModel | null = null;

  // Listas y selección
  companies: CompanyUser[] = [];
  campaigns: CampaignWithFunnel[] = [];
  templates: CompanyChannelTemplateView[] = [];

  selectedCompany: number | null = null;
  selectedCampaign: number | null = null;
  selectedTemplate: number | null = null;

  // Form fields
  description = '';
  leads: CampaignWhatsappPushLeadInput[] = [];

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
    private alert: AlertService,
  ) {}

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
    this.companies = [];
    const userId = this.loggedUser?.user_id!;
    this.companyService.getCompaniesByUserId(userId)
      .then(resp => {
        this.companies = resp?.data || [];
      })
      .catch(err => console.error('Error loading companies:', err))
      .finally(() => this.loadingCompanies = false);
  }

  onCompanySelected() {
    if (!this.selectedCompany) {
      this.campaigns = [];
      this.templates = [];
      this.selectedCampaign = null;
      this.selectedTemplate = null;
      return;
    }
    this.loadCampaignsForCompany(this.selectedCompany);
    this.loadTemplatesForCompany(this.selectedCompany);
  }

  loadCampaignsForCompany(companyId: number) {
    this.campaignLoading = true;
    this.campaigns = [];
    this.campaignService.getByCompany(companyId)
      .then(resp => this.campaigns = resp?.data || [])
      .catch(err => console.error('Error loading campaigns:', err))
      .finally(() => this.campaignLoading = false);
  }

  loadTemplatesForCompany(companyId: number) {
    this.templateLoading = true;
    this.templates = [];
    this.channelService.getWhatsappTemplatesByCompany(companyId)
      .then(resp => {
        // filtra solo los que tengan template_id
        this.templates = (resp?.data || []).filter(t => t.template_id);
      })
      .catch(err => console.error('Error loading templates:', err))
      .finally(() => this.templateLoading = false);
  }

onFileSelected(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      const parsed: any[] = result.data as any[];
      this.leads = parsed
        .filter(r => r.phone_number) // solo filas con teléfono
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
    error: (error) => {
      console.error('Error al parsear CSV:', error);
      this.alert.error('No se pudo leer el CSV.');
    }
  });
}

  private parseCSV(content: string): CampaignWhatsappPushLeadInput[] {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idxPhone = header.indexOf('phone_number');
    const idxName  = header.indexOf('full_name');

    if (idxPhone === -1) return [];

    const rows = lines.slice(1);
    const out: CampaignWhatsappPushLeadInput[] = [];

    for (const row of rows) {
      // parsing simple (si necesitas comillas/escapes, conviene PapaParse)
      const cols = row.split(',').map(c => c.trim());
      const phone = cols[idxPhone] || '';
      if (!phone) continue;

      const fullName = idxName >= 0 ? (cols[idxName] || '') : '';
      out.push({ phone_number: phone, full_name: fullName || undefined });
    }
    return out;
    // TIP: si ya usas Papa Parse en el proyecto, puedo pasártelo con Papa por mayor robustez.
  }

  removeLead(i: number) {
    this.leads.splice(i, 1);
  }

  clearLeads() {
    this.leads = [];
  }

  // === Envío ===
  canSend(): boolean {
    return !!this.selectedCompany && !!this.selectedCampaign && !!this.selectedTemplate && !!this.description.trim() && this.leads.length > 0 && !this.submitting;
  }

  async sendPush() {
    if (!this.canSend()) return;

    this.submitting = true;
    const payload: CampaignWhatsappPushRequest = {
      campaign_id: this.selectedCampaign!,
      description: this.description.trim(),
      template_id: this.selectedTemplate!,
      changed_by: this.loggedUser?.user_id || 0, // ajusta al campo que uses como user_id
      leads: this.leads.map(l => ({
        phone_number: l.phone_number,
        full_name: l.full_name?.trim() || undefined,
      })),
    };

    try {
      const resp = await this.pushService.createWhatsappPush(payload);
      if (resp?.success) {
        this.alert.success(`Push creado (ID: ${resp.data?.push_id ?? '—'})`);
        // opcional: reset suave
        // this.description = '';
        // this.leads = [];
      } else {
        this.alert.error(resp?.message || 'No se pudo registrar el push.');
      }
    } catch (e) {
      console.error(e);
      this.alert.error('Error al registrar el push.');
    } finally {
      this.submitting = false;
    }
  }
}