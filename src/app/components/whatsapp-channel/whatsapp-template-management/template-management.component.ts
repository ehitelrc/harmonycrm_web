// template-management.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { CompanyUser } from '@app/models/companies_user_view';
import { Channel } from '@app/models/channel.model';
import { MessageTemplate } from '@app/models/message-template.model';
import { AuthService, LanguageService } from '@app/services';
import { CompanyService } from '@app/services/company.service';
import { ChannelService } from '@app/services/channel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';
import { MessageTemplateFormComponent } from '../message-template-form/message-template-form.component';
import { TemplateIntegrationPanelComponent } from '../template-integration-panel/template-integration-panel.component';

@Component({
  selector: 'app-template-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    MessageTemplateFormComponent,
    TemplateIntegrationPanelComponent,
  ],
  templateUrl: './template-management.component.html',
  styleUrls: ['./template-management.component.css'],
})
export class TemplateManagementComponent implements OnInit {
  loggedUser: any = null;

  companies: CompanyUser[] = [];
  channels: Channel[] = [];

  messageTemplates: MessageTemplate[] = [];
  loadingMessageTemplates = false;
  selectedMessageTemplate: MessageTemplate | null = null;

  selectedChannelId: number | null = null;

  loadingCompanies = false;
  loadingChannels = false;

  // Form dialog (create / edit)
  isFormOpen = false;
  editingTemplate: MessageTemplate | null = null;

  // Delete modal
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

  get t() { return this.i18n.t.bind(this.i18n); }

  ngOnInit(): void {
    this.loggedUser = this.auth.getCurrentUser();
    this.loadChannels();
  }

  loadChannels() {
    this.loadingChannels = true;
    this.channelService.getAll()
      .then(resp => this.channels = resp?.data || [])
      .catch(() => this.alert.error('Error cargando canales'))
      .finally(() => this.loadingChannels = false);
  }

  onChannelChanged(): void {
    this.messageTemplates = [];
    this.selectedMessageTemplate = null;
    if (!this.selectedChannelId) return;
    this.loadMessageTemplates();
  }

  async loadMessageTemplates(): Promise<void> {
    if (!this.selectedChannelId) return;
    this.loadingMessageTemplates = true;
    try {
      const resp = await this.templateService.getAllTemplates(this.selectedChannelId);
      this.messageTemplates = resp?.data || [];
    } catch {
      this.alert.error('Error cargando plantillas');
    } finally {
      this.loadingMessageTemplates = false;
    }
  }

  selectMessageTemplate(t: MessageTemplate): void {
    // Clicking selected template again deselects it
    this.selectedMessageTemplate = this.selectedMessageTemplate?.id === t.id ? null : t;
  }

  isSelected(t: MessageTemplate): boolean {
    return this.selectedMessageTemplate?.id === t.id;
  }

  // Actualiza el contador del badge en tiempo real al vincular/desvincular
  onIntegrationToggled(delta: number): void {
    if (!this.selectedMessageTemplate) return;
    // Actualiza en la lista
    const inList = this.messageTemplates.find(t => t.id === this.selectedMessageTemplate!.id);
    if (inList) inList.linked_count = Math.max(0, (inList.linked_count || 0) + delta);
    // Actualiza la referencia seleccionada
    this.selectedMessageTemplate.linked_count = Math.max(0, (this.selectedMessageTemplate.linked_count || 0) + delta);
  }

  // ── Form (create / edit) ──────────────────────────────────────────────────

  openCreateDialog(): void {
    this.editingTemplate = null;
    this.isFormOpen = true;
  }

  openEditDialog(t: MessageTemplate, event: Event): void {
    event.stopPropagation(); // don't trigger selectMessageTemplate
    this.editingTemplate = { ...t };
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.editingTemplate = null;
  }

  async onFormSuccess(saved: MessageTemplate): Promise<void> {
    const wasEditing = !!this.editingTemplate;
    this.closeDialog();
    await this.loadMessageTemplates();
    // Keep panel open on the saved template
    const fresh = this.messageTemplates.find(t => t.id === saved.id) ?? saved;
    this.selectedMessageTemplate = fresh;
    this.alert.success(
      wasEditing
        ? `Plantilla actualizada (#${saved.id})`
        : `Plantilla creada (#${saved.id})`
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  askDelete(t: MessageTemplate, event: Event): void {
    event.stopPropagation();
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
      const r = await this.templateService.deleteMessageTemplate(this.deletingId);
      if (r?.success) {
        this.alert.success('Plantilla eliminada');
        if (this.selectedMessageTemplate?.id === this.deletingId) {
          this.selectedMessageTemplate = null;
        }
        await this.loadMessageTemplates();
        this.cancelDelete();
      } else {
        this.alert.error(r?.message || 'Error al eliminar la plantilla');
      }
    } catch (err: any) {
      this.alert.error(err?.error?.message || err?.message || 'Error al eliminar la plantilla');
    } finally {
      this.isDeleting = false;
    }
  }
}
