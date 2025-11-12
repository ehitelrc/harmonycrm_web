// src/app/features/channel-integrations/channel-integration-management.component.ts
import { Component } from '@angular/core';

import { MainLayoutComponent } from '@app/components/layout/main-layout.component';

import { AuthorizationService } from '@app/services/extras/authorization.service';

import { CompanyService } from '@app/services/company.service';
import { ChannelService } from '@app/services/channel.service';
import { ChannelIntegration, ChannelIntegrationDTO } from '@app/models/channel-integration.model';
import { Company } from '@app/models/company.model';
import { Channel } from '@app/models/channel.model';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';
import { ChannelIntegrationsListComponent } from '../channel-integration-list/channel-integrations-list.component';
import { ChannelIntegrationFormComponent } from '../channel-integration-form/channel-integration-form.component';

@Component({
    selector: 'app-channel-integration-management',
    standalone: true,
    imports: [
        CommonModule, FormsModule, MainLayoutComponent, ChannelIntegrationsListComponent, ChannelIntegrationFormComponent

    ],
    templateUrl: './channel-integration-management.component.html'
})
export class ChannelIntegrationManagementComponent {
    companies: Company[] = [];
    channels: Channel[] = [];
    integrations: ChannelIntegrationDTO[] = [];

    selectedCompanyId: number | null = null;
    selectedChannelId: number | null = null;

    isFormOpen = false;
    selectedIntegration: ChannelIntegrationDTO | null = null;

    isLoading = false;
 
    constructor(

        private companyService: CompanyService,
        private channelService: ChannelService,
        private alert: AlertService,
        private lang: LanguageService,
        private auth: AuthorizationService
    ) { }

    get t() { return this.lang.t.bind(this.lang); }

    async ngOnInit() {
        this.loadCompanies();
        this.loadChannels();
    }

    isAdmin() { return this.auth.isAdmin(); }

    async loadCompanies() {
        const r = await this.companyService.getAllCompanies();
        if (r.success) this.companies = r.data;
    }

    async loadChannels() {
        const r = await this.channelService.getAll();
        if (r.success) this.channels = r.data;
    }

    async onCompanyChange() {
        if (!this.selectedCompanyId) return;
        this.loadIntegrations();
    }

    async onChannelChange() {
        if (!this.selectedCompanyId) return;
        this.loadIntegrations();
    }



    openForm() { this.isFormOpen = true; this.selectedIntegration = null; }
    

    onEdit(i: ChannelIntegrationDTO) { this.selectedIntegration = i; this.isFormOpen = true; }

    async onSuccess() {
        this.closeForm();
        await this.loadIntegrations();
        this.alert.success(this.t('integration.saved_successfully'));
    }

    async onRemove(i: ChannelIntegration) {

    }



    async loadIntegrations() {
        if (!this.selectedCompanyId || !this.selectedChannelId) return;
        this.isLoading = true;
        const res = await this.channelService.getIntegrationsByCompanyAndChannel(this.selectedCompanyId, this.selectedChannelId);
        if (res.success && res.data) this.integrations = res.data;
        this.isLoading = false;
    }


    openIntegrationForm(integration?: ChannelIntegrationDTO) {
        this.selectedIntegration = integration ?? null;
        this.isFormOpen = true;
    }

    closeForm() {
        this.isFormOpen = false;
        this.selectedIntegration = null;
    }

    async onIntegrationSaved(saved: ChannelIntegrationDTO) {
        this.closeForm();
        await this.loadIntegrations();
    }
 
    onEditIntegration(i: ChannelIntegrationDTO) { this.openIntegrationForm(i); }
    onDeleteIntegration(i: ChannelIntegrationDTO) { /* abre confirmación y llama a delete */ }
}