import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelTemplateIntegration } from '@app/models/channel-template-integration.model';
import { MessageTemplate } from '@app/models/message-template.model';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';

@Component({
    selector: 'app-template-integration-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './template-integration-panel.component.html',
})
export class TemplateIntegrationPanelComponent implements OnChanges {
    @Input() template: MessageTemplate | null = null;

    integrations: ChannelTemplateIntegration[] = [];
    isLoading = false;
    togglingId: number | null = null;

    constructor(
        private templateService: WhatsAppTemplateService,
        private alert: AlertService,
        private lang: LanguageService
    ) { }

    get t() { return this.lang.t.bind(this.lang); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['template'] && this.template) {
            this.loadIntegrations();
        } else if (!this.template) {
            this.integrations = [];
        }
    }

    async loadIntegrations(): Promise<void> {
        if (!this.template) return;
        this.isLoading = true;
        try {
            const resp = await this.templateService.getIntegrationsForTemplate(this.template.id);
            this.integrations = resp?.data || [];
        } catch {
            this.alert.error('Error cargando integraciones de la plantilla');
        } finally {
            this.isLoading = false;
        }
    }

    async toggle(item: ChannelTemplateIntegration): Promise<void> {
        if (!this.template || this.togglingId === item.integration_id) return;
        this.togglingId = item.integration_id;
        try {
            if (item.is_linked) {
                await this.templateService.unassignIntegration(item.integration_id, this.template.id);
                item.is_linked = false;
                this.alert.success(`Integración desvinculada: ${item.integration_name}`);
            } else {
                await this.templateService.assignIntegration(item.integration_id, this.template.id);
                item.is_linked = true;
                this.alert.success(`Integración vinculada: ${item.integration_name}`);
            }
        } catch {
            this.alert.error('Error al cambiar la vinculación');
        } finally {
            this.togglingId = null;
        }
    }

    linkedCount(): number {
        return this.integrations.filter(i => i.is_linked).length;
    }
}
