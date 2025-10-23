// template-management.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { CompanyUser } from '@app/models/companies_user_view';
import { Channel } from '@app/models/channel.model';
import { WhatsAppTemplate } from '@app/models/whatsapp-template.model';
import { AuthService, LanguageService } from '@app/services';
import { CompanyService } from '@app/services/company.service';
import { ChannelService } from '@app/services/channel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';
import { VWChannelIntegration } from '@app/models/vw-channel-integration.model';
import { TemplatesListComponent } from '../whatsapp-template-list/templates-list.component';
import { TemplateFormComponent } from '../whatsapp-template-form/template-form.component';

// 👇 importa el listado standalone 
@Component({
    selector: 'app-template-management',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        MainLayoutComponent, 
        TemplatesListComponent,
        TemplateFormComponent
    ], // 👈 aquí
    templateUrl: './template-management.component.html',
    styleUrls: ['./template-management.component.css'],
})
export class TemplateManagementComponent implements OnInit {
    loggedUser: any = null;

    companies: CompanyUser[] = [];
    channels: Channel[] = [];
    templates: WhatsAppTemplate[] = [];

    selectedCompany: number | null = null;

    loadingCompanies = false;
    loadingChannels = false;
    loadingTemplates = false;

    integrations: VWChannelIntegration[] = [];
    selectedIntegration: VWChannelIntegration | null = null;
    loadingIntegrations = false;

    isFormOpen = false;
    selectedTemplate: WhatsAppTemplate | null = null;

    isDeleteOpen = false;
    deletingId: number | null = null;
    isDeleting = false;
 
    

    constructor(
        private auth: AuthService,
        private i18n: LanguageService,
        private companyService: CompanyService,
        private channelService: ChannelService,
        private templateService: WhatsAppTemplateService,
        private alert: AlertService
    ) { }

    get t() {
        return this.i18n.t.bind(this.i18n);
    }

    ngOnInit(): void {
        this.loggedUser = this.auth.getCurrentUser();
        this.loadCompanies();
        this.loadChannels();
    }

    loadCompanies() {
        this.loadingCompanies = true;
        const userId = this.loggedUser?.user_id!;
        this.companyService.getCompaniesByUserId(userId)
            .then(resp => this.companies = resp?.data || [])
            .catch(() => this.alert.error('Error cargando compañías'))
            .finally(() => this.loadingCompanies = false);
    }

    loadChannels() {
        this.loadingChannels = true;
        this.channelService.getAll()
            .then(resp => this.channels = resp?.data || [])
            .catch(() => this.alert.error('Error cargando canales'))
            .finally(() => this.loadingChannels = false);
    }

    onFilterChanged() {
        this.selectedIntegration = null;
        this.templates = [];

        if (!this.selectedCompany) return;
        this.loadIntegrations();
    }

    onChannelIntegrationSelected() {
        this.templates = [];
        if (!this.selectedIntegration) return;
        this.loadTemplates();
    }

    loadIntegrations() {
        this.loadingIntegrations = true;
        this.channelService.getWhatsappIntegrationsByCompany(this.selectedCompany!)
            .then(resp => this.integrations = resp?.data || [])
            .catch(() => this.alert.error('Error cargando integraciones'))
            .finally(() => this.loadingIntegrations = false);
    }

    loadTemplates() {
        if (!this.selectedIntegration) return;
        this.loadingTemplates = true;
        this.templateService.getWhatsappTemplatesByIntegration(this.selectedIntegration.channel_integration_id)
            .then(resp => this.templates = resp?.data || [])
            .catch(() => this.alert.error('Error cargando plantillas'))
            .finally(() => this.loadingTemplates = false);
    }

 
// abrir creación
openCreateDialog(): void {
  this.selectedTemplate = null;
  this.isFormOpen = true;
}

// abrir edición
openEditDialog(t: WhatsAppTemplate): void {
  this.selectedTemplate = t;
  this.isFormOpen = true;
}

closeDialog(): void {
  this.isFormOpen = false;
  this.selectedTemplate = null;
}

async onSuccess(saved: WhatsAppTemplate): Promise<void> {
  this.closeDialog();
  await this.loadTemplates();
  this.alert.success(
    this.selectedTemplate
      ? `${this.t('whatsapp_template.updated_successfully')} (#${saved.id})`
      : `${this.t('whatsapp_template.created_successfully')} (#${saved.id})`
  );
}

// Delete modal
askDelete(t: WhatsAppTemplate): void {
 
  this.deletingId = t.id;
  this.isDeleteOpen = true;
}
cancelDelete(): void {
  this.deletingId = null;
  this.isDeleteOpen = false;
}

async confirmDelete(): Promise<void> {
  if (!this.deletingId) return;
  this.isDeleting = true;
  try {
    const r = await this.templateService.deleteWhatsappTemplate(this.deletingId);
    if (r.success) {
      this.alert.success(this.t('whatsapp_template.deleted_successfully'));
      await this.loadTemplates();
    } else {
      this.alert.error(this.t('whatsapp_template.failed_to_delete_template'));
    }
  } finally {
    this.isDeleting = false;
    this.cancelDelete();
  }
}

// hooks del listado
onEdit(t: WhatsAppTemplate) { this.openEditDialog(t); }
onRemove(t: WhatsAppTemplate) { this.askDelete(t); }
onView(t: WhatsAppTemplate) { /* opcional: detalle */ }
    
}