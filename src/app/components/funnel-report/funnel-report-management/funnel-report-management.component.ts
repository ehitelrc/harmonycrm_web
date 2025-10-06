import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { CompanyUser } from '@app/models/companies_user_view';
import { AuthService, DashboardService, LanguageService } from '@app/services';
import { AgentUserService } from '@app/services/agent-user.service';
import { CompanyService } from '@app/services/company.service';
import { AlertService } from '@app/services/extras/alert.service';
import { User as UserAuthModel } from '../../../models/auth.model';
import { Campaign } from '@app/models/campaign.model';
import { CampaignService } from '@app/services/campaign.service';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { FunnelStage } from '@app/models/funnel.model';
import { FunnelService } from '@app/services/funnel.service';
import { CaseListComponent } from '../case-list/ case-list.component';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';
import { CaseService } from '@app/services/case.service';
import { CaseDetailComponent } from '../detail/case-detail.component';
import { ClientFormComponent } from '@app/components/clients/clients-form/client-form.component';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';

import { DashboardCampaignFunnelSummary } from '@app/models/campaign_funnel_summary_view';
import { CampaignFunnelOrganicComponent } from './campaign-funnel-organic.component';
import { CampaignFunnelComponent } from './campaign-funnel.component';

@Component({
    selector: 'app-cases-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MainLayoutComponent,
        CaseListComponent,
        CaseDetailComponent,
        CampaignFunnelOrganicComponent,
 

    ],
    templateUrl: './funnel-report-management.component.html',
    styleUrls: ['./funnel-report-management.component.css']
})
export class FunnelReportManagementComponent implements OnInit {

    companies: CompanyUser[] = [];
    loadingCompanies = false;
    loggedUser: UserAuthModel | null = null;

    caseList: CaseGeneralInformation[] = [];
    caseLoading = false;

    selectedCase: CaseGeneralInformation | null = null;

    data: DashboardCampaignFunnelSummary[] = [];

    chartData: any[] = [];


    statuses = [
        { id: 'open', name: 'Abierto' },
        { id: 'in_progress', name: 'En Progreso' },
        { id: 'closed', name: 'Cerrado' }
    ];

    selectedCompany: number | null = null;
    selectedStatus: string | null = null;

    campaigns: CampaignWithFunnel[] = [];
    selectedCampaign: number | null = null;
    selectedFunnel: number | null = null;
    selectedFunnelObject: CampaignWithFunnel | null = null;


    campaignLoading = false;

    funnelStages: FunnelStage[] = [];
    selectedFunnelStage: number | null = null;
    funnelStageLoading = false;

    isFormOpen = false;
    currentClient: Client | null = null;
    tmpClient: Client | null = null;

    constructor(
        private agentUserService: AgentUserService,
        private languageService: LanguageService,
        private alertService: AlertService,
        private authService: AuthService,
        private campaignService: CampaignService,
        private caseService: CaseService,
        private companyService: CompanyService,
        private funnelService: FunnelService,
        private clientService: ClientService,
        private dashboardService: DashboardService
    ) {



    }

    get t() {
        return this.languageService.t.bind(this.languageService);
    }



    ngOnInit(): void {
        this.loggedUser = this.authService.getCurrentUser();
        this.loadCompanies();
        this.filterCases();
    }

    filterCases() {
        this.selectedFunnel = null;
        this.selectedFunnelStage = null;
        this.funnelStages = [];
        this.loadCampaignsForCompany(this.selectedCompany!);
    }

    loadCompanies() {

        this.companies = [];

        this.companyService.getCompaniesByUserId(this.loggedUser?.user_id!).then(response => {
            if (response && response.data) {
                this.companies = response.data.map(company => ({
                    company_id: company.company_id,
                    company_name: company.company_name
                }));

                console.log('User companies loaded:', this.companies);
            }


            this.loadingCompanies = false;
        }).catch(error => {
            console.error('Error loading companies:', error);
            this.loadingCompanies = false;
        });
    }

    loadCampaignsForCompany(companyId: number) {
        this.caseList = [];
        this.campaignLoading = true;
        this.campaigns = [];
        this.campaignService.getByCompany(companyId).then(response => {
            if (response && response.data) {
                this.campaigns = response.data;
                console.log('Campaigns loaded for company', companyId, this.campaigns);
            }

            this.campaignLoading = false;
        }).catch(error => {
            console.error('Error loading campaigns for company', companyId, error);
            this.campaignLoading = false;
        });
    }

    campaignSelected() {
        this.funnelStages = [];
        this.selectedFunnelStage = null;
        this.caseList = [];
        this.selectedFunnel = this.selectedFunnelObject?.funnel_id || null;
        this.selectedCampaign = this.selectedFunnelObject?.campaign_id || null;
        // this.loadFunnelStagesForCampaign(this.selectedFunnel!);

        // Cargar aquí el gráfico del funnel
        if (this.selectedCampaign) {
            this.dashboardService.getCampaignFunnelSummaryByCompany(this.selectedCampaign).then(response => {
                if (response && response.data) {
                    this.data = response.data;

                    this.data = response.data.map(s => ({
                        ...s,
                        total_cases: Number(s.total_cases ?? 0)
                    }));
                    console.log('Funnel summary data loaded for campaign', this.selectedCampaign, this.data);
                } else {
                    this.data = [];
                }
            }).catch(error => {
                console.error('Error loading funnel summary for campaign', this.selectedCampaign, error);
                this.data = [];
            });
        } else {
            this.data = [];
        }
    }

    loadFunnelStagesForCampaign(funnelId: number) {
        this.funnelStages = [];
        this.funnelStageLoading = true;
        this.caseList = [];

        this.funnelService.getStages(funnelId).then(response => {
            if (response && response.data) {
                this.funnelStages = response.data;
                console.log('Funnel stages loaded for campaign', funnelId, this.funnelStages);
            }
            this.funnelStageLoading = false;
        }).catch(error => {
            console.error('Error loading funnel stages for campaign', funnelId, error);
            this.funnelStageLoading = false;
        });

    }



    onEditCase(c: CaseGeneralInformation) { console.log('Editar caso:', c); }
    onRemoveCase(c: CaseGeneralInformation) { console.log('Eliminar caso:', c); }


    loadClientDetails(clientId: number) {
        this.currentClient = null;
        if (!clientId) return;

        this.clientService.getById(clientId).then(response => {
            if (response && response.data) {
                this.currentClient = response.data;
                console.log('Client details loaded:', this.currentClient);
            }
        }).catch(error => {
            console.error('Error loading client details for clientId', clientId, error);
        });
    }


    onViewCase(c: CaseGeneralInformation) {
        if (c.client_id) {
            this.loadClientDetails(c.client_id);
        } else {
            this.currentClient = null;
        }

        this.selectedCase = c;
    }

    goBackToList() {
        this.selectedCase = null;
        this.currentClient = null;
    }


    async onSuccess(saved: Client) {
        // this.alert.success(
        //   this.currentClient
        //     ? `${this.t('client.updated_successfully')} (#${saved.full_name})`
        //     : `${this.t('client.created_successfully')} (#${saved.full_name})`
        // );

        // this.closeDialog();

        // this.currentClient = saved;

        // const sc = this.selectedCase as CaseWithChannel | null;
        // if (!sc) return;

        // await this.chatService.assignCaseToClient(sc.case_id, this.currentClient.id);

        // const updated: CaseWithChannel = {
        //   ...sc,                       // ya es CaseWithChannel (no null), no ensancha tipos
        //   client_name: saved.full_name
        // };
        // this.selectedCase = updated;

        // this.cases = this.cases.map(c =>
        //   c.case_id === sc.case_id ? { ...c, client_name: saved.full_name } : c
        // );
        // this.applyContactFilter();

        // this.alert.success('Cliente asignado al caso');
    }

    addNewClient(): void {
        // this.tmpClient = this.currentClient;
        // this.currentClient = null;
        // this.isFormOpen = true;
    }

    closeCaseDetail(): void {
        this.selectedCase = null;
        this.currentClient = null;
    }

    closeDialog(): void {
        this.isFormOpen = false;
        this.currentClient = this.tmpClient;
    }


}