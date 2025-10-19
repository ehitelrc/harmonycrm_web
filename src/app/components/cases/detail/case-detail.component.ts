import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';
import { AssignCaseToCampaignPayload, CaseFunnelEntry, CaseService, VwCaseCurrentStage } from '@app/services/case.service';
import { CaseNoteView } from '@app/models/case-notes-view.model';
import { Client } from '@app/models/client.model';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CaseNote } from '@app/models/case-notes.model';
import { AuthService, LanguageService } from '@app/services';
import { ClientFormComponent } from '@app/components/clients/clients-form/client-form.component';
import { AlertService } from '@app/services/extras/alert.service';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { ClientService } from '@app/services/client.service';
import { CampaignService } from '@app/services/campaign.service';
import { Department } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';
import { AgentUser } from '@app/models/agent_user.models';
import { AgentDepartmentAssignment } from '@app/models/agent_department_assignment_view';
import { AgentUserService } from '@app/services/agent-user.service';
import { AgentDepartmentInformation } from '@app/models/agent-department-information.model';
import { MoveCaseStagePayload } from '@app/models/move_case_stager_payload';
import { MoveStageModalComponent } from '@app/components/chat/stage_movement/move-stage-modal.component';

@Component({
    selector: 'app-case-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClientFormComponent,
        MoveStageModalComponent
    ],
    templateUrl: './case-detail.component.html',
    styleUrls: ['./case-detail.component.css']
})
export class CaseDetailComponent implements OnInit {
    @Input() caseData!: CaseGeneralInformation;
    @Input() client!: Client;
    @Output() back = new EventEmitter<void>();

    currentCaseFunnel: VwCaseCurrentStage | null = null;
    notes: CaseNoteView[] = [];
    isLoadingNotes = false;
    isSavingNote = false;
    newNote = '';

    loggedUser: UserAuthModel | null = null;

    tmpClient: Client | null = null;
    currentClient: Client | null = null;

    isFormOpen = false;

    // Case mode view
    // ======== Estado del modal de asignación ========
    isAssignClientOpen = false;
    clientSearch = '';
    clientResults: Client[] = [];
    isSearchingClients = false;
    selectedClientCandidate: Client | null = null;

    isAssigningClient = false;

    filteredClients: Client[] = [];
    isLoadingClients = false;

    // =============================================


    // ======== Estado del modal de campaña ========
    isAssignCampaignOpen = false;
    campaignSearch = '';
    campaigns: CampaignWithFunnel[] = [];
    filteredCampaigns: CampaignWithFunnel[] = [];
    selectedCampaignCandidate: CampaignWithFunnel | null = null;
    isLoadingCampaigns = false;
    isAssigningCampaign = false;
    currentCampaign: CampaignWithFunnel | null = null;


    // ======== Estado del modal de departamento ========
    isAssignDepartmentOpen = false;
    departmentSearch = '';
    departments: Department[] = [];
    filteredDepartments: Department[] = [];
    selectedDepartmentCandidate: Department | null = null;
    isLoadingDepartments = false;
    isAssigningDepartment = false;


    // ======== Estado del modal de agente ========
    isAssignAgentOpen = false;
    agentSearch = '';
    agents: AgentDepartmentInformation[] = [];
    filteredAgents: AgentDepartmentInformation[] = [];
    selectedAgentCandidate: AgentDepartmentInformation | null = null;
    isLoadingAgents = false;
    isAssigningAgent = false;
    currentAgent: AgentDepartmentInformation | null = null;

    // Estado para mover de stage
    isMoveStageOpen = false;
    currentStage: VwCaseCurrentStage | null = null;

    isHistoryOpen = false;
    isLoadingHistory = false;
    history: CaseFunnelEntry[] = [];



    isCloseCaseOpen = false;   // controla si el modal está abierto
    closeNote = '';            // nota opcional al cerrar
    isClosingCase = false;     // loading/disable state


    isConfirmCloseOpen = false;


    constructor(
        private caseService: CaseService,
        private authService: AuthService,
        private alert: AlertService,
        private lang: LanguageService,
        private clientService: ClientService,
        private campaignService: CampaignService,
        private departmentService: DepartmentService,
        private agentUserService: AgentUserService,


    ) {
        this.currentClient = this.client;

    }

    get t() { return this.lang.t.bind(this.lang); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['client'] && changes['client'].currentValue) {
            this.currentClient = changes['client'].currentValue;
        }
    }


    ngOnInit(): void {
        this.loggedUser = this.authService.getCurrentUser();


        if (this.caseData?.case_id) {

            this.loadCaseDetails();
            this.loadCurrenteCampaign();
        }
    }

    async loadCaseDetails() {
        this.currentCaseFunnel = (await this.caseService.getCaseFunnelCurrent(this.caseData.case_id)).data || null;
        this.notes = (await this.caseService.getByCase(this.caseData.case_id)).data || [];
    }

    async addNote() {
        const body = (this.newNote || '').trim();
        if (!body || !this.caseData?.case_id) return;
        try {
            this.isSavingNote = true;
            const payload: CaseNote = {
                id: null,
                author_id: this.loggedUser?.user_id || 0,
                case_id: this.caseData.case_id,
                note: body,
                created_at: null,
            };
            const res = await this.caseService.create(payload);
            if (res?.data) {
                // agrega al inicio (más reciente arriba)
                this.loadCaseDetails();
            }
            this.newNote = '';
        } finally {
            this.isSavingNote = false;
        }
    }

    async moveToStage(stageId: number) {
        // if (!stageId) return;
        // await this.caseService.moveCaseStage({
        //   case_id: this.caseData.case_id,
        //   stage_id: stageId,
        //   changed_by: 0, // logged user id
        // });
        // await this.loadCaseDetails();
    }

    async closeCase() {
        // await this.caseService.closeCase(this.caseData.case_id, "Cierre manual", 0, this.caseData.funnel_id);
        // this.back.emit();
    }

    goBack() {
        this.back.emit();
    }

    addNewClient(): void {
        this.tmpClient = this.client;
        this.currentClient = null;
        this.isFormOpen = true;
    }

    openAssignClientModal() {
        this.isAssignClientOpen = true;
        this.clientSearch = '';
        this.clientResults = [];
        this.selectedClientCandidate = null;
        this.isSearchingClients = false;
        this.isAssigningClient = false;
    }


    async onSuccess(saved: Client) {
        this.alert.success(
            this.currentClient
                ? `${this.t('client.updated_successfully')} (#${saved.full_name})`
                : `${this.t('client.created_successfully')} (#${saved.full_name})`
        );

        this.closeDialog();

        this.currentClient = saved;
        this.client = saved;

        const sc = this.caseData as CaseWithChannel | null;
        if (!sc) return;

        await this.caseService.assignCaseToClient(sc.case_id, this.currentClient.id);

        const updated: CaseWithChannel = {
            ...sc,                       // ya es CaseWithChannel (no null), no ensancha tipos
            client_name: saved.full_name
        };


        this.caseData.client_name = saved.full_name;
        this.caseData.client_id = saved.id;


        //this.selectedCase = updated;

        this.alert.success('Cliente asignado al caso');
    }


    closeDialog(): void {
        this.isFormOpen = false;
        this.currentClient = this.tmpClient;
    }


    async confirmAssignClient() {
        if (!this.selectedClientCandidate) return;

        try {
            this.isAssigningClient = true;
            // // 👉 Llama a tu backend para vincular el cliente
            // // Ejemplo esperado: caseService.assignClient(caseId, clientId)
            await this.caseService.assignCaseToClient(this.caseData.case_id, this.selectedClientCandidate.id);

            // // Reflejar en UI (mínimo el nombre)
            this.caseData = {
                ...this.caseData,
                client_name: this.selectedClientCandidate.full_name
            };

            this.currentClient = this.selectedClientCandidate;

            this.alert.success('Cliente asignado al caso');
            this.closeAssignClientModal();
        } catch (e) {
            this.alert.error('No se pudo asignar el cliente');
        } finally {
            this.isAssigningClient = false;
        }
    }


    closeAssignClientModal() {
        this.isAssignClientOpen = false;
        // Limpieza opcional
        this.clientSearch = '';
        this.clientResults = [];
        this.selectedClientCandidate = null;
        this.isSearchingClients = false;
        this.isAssigningClient = false;

    }

    // Buscar clientes (puedes mejorar con debounce si quieres)
    async onClientSearchChange(q: string) {
        const query = (q || '').trim();
        if (!query) {
            this.clientResults = [];
            return;
        }

        try {
            this.isSearchingClients = true;
            // // 👉 Llama a tu servicio real de clientes
            // // Ejemplo esperado: this.clientService.search(query)
            // // Debe devolver [{id, name, email?, phone?}, ...]
            const res = await this.clientService.getAll();

            this.clientResults = Array.isArray(res) ? res : (res?.data || []);

            this.filteredClients = this.clientResults.filter(c =>
                (c.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
                (c.email || '').toLowerCase().includes(query.toLowerCase()) ||
                (c.phone || '').toLowerCase().includes(query.toLowerCase())
            );

        } catch (e) {
            this.alert.error('Error buscando clientes');
            this.clientResults = [];
            this.isSearchingClients = false;
        } finally {
            this.isSearchingClients = false;
        }
    }

    selectClientCandidate(cli: Client) {
        this.selectedClientCandidate = cli;
    }




    //////
    ///// Campaña
    //////


    openAssignCampaignModal() {
        this.isAssignCampaignOpen = true;
        this.campaignSearch = '';
        this.selectedCampaignCandidate = null;
        this.loadCampaigns();          // carga inicial
    }

    closeAssignCampaignModal() {
        this.isAssignCampaignOpen = false;
        this.campaignSearch = '';
        this.filteredCampaigns = [];
        this.selectedCampaignCandidate = null;
        this.isLoadingCampaigns = false;
        this.isAssigningCampaign = false;
    }

    private async loadCampaigns(): Promise<void> {
        try {
            this.isLoadingCampaigns = true;

            const res = await this.campaignService.getByCompany(this.caseData?.company_id!);
            const data = (res as { data?: unknown })?.data;           // <- narrow local
            const list: CampaignWithFunnel[] = Array.isArray(data) ? data as CampaignWithFunnel[] : [];

            this.campaigns = list;
            this.filteredCampaigns = list;
        } catch {
            this.alert.error('Error cargando campañas');
            this.campaigns = [];
            this.filteredCampaigns = [];
        } finally {
            this.isLoadingCampaigns = false;
        }
    }

    onCampaignSearchChange(q: string) {
        const query = (q || '').trim().toLowerCase();
        if (!query) {
            this.filteredCampaigns = this.campaigns;
            return;
        }
        this.filteredCampaigns = this.campaigns.filter(c =>
            (c.campaign_name || '').toLowerCase().includes(query) ||
            (c.funnel_name || '').toLowerCase().includes(query)
        );
    }

    selectCampaignCandidate(c: CampaignWithFunnel) {
        this.selectedCampaignCandidate = c;
    }

    async confirmAssignCampaign() {
        if (!this.caseData || !this.selectedCampaignCandidate) return;

        try {
            this.isAssigningCampaign = true;

            // 👉 Llama a tu backend
            // Debes implementar esto en CaseService si aún no existe:
            // POST /cases/:caseId/campaign/:campaignId   (por ejemplo)

            const payload: AssignCaseToCampaignPayload = {
                case_id: this.caseData?.case_id || 0,
                campaign_id: this.selectedCampaignCandidate?.campaign_id || 0,
                changed_by: this.loggedUser?.user_id || 0,
            };

            await this.caseService.assignCaseToCampaign(payload);

            // Refleja en UI
            this.currentCampaign = this.selectedCampaignCandidate;

            // Si tu selectedCase trae campaign_name, actualízalo también
            (this.caseData as any).campaign_name = this.currentCampaign.campaign_name;
            (this.caseData as any).campaign_id = this.currentCampaign.campaign_id;


            this.alert.success('Campaña vinculada al caso');
            this.closeAssignCampaignModal();
        } catch (e) {
            this.alert.error('No se pudo vincular la campaña');
        } finally {
            this.isAssigningCampaign = false;
        }
    }

    loadCurrenteCampaign() {
        if (this.caseData?.campaign_id) {
            this.campaignService.getById(this.caseData.campaign_id).then(res => {
                if (res?.data) {
                    this.currentCampaign = res.data as CampaignWithFunnel;
                }
            });
        }
    }

    ///////
    ///// Departamento
    //////

    openAssignDepartmentModal() {
        this.isAssignDepartmentOpen = true;
        this.departmentSearch = '';
        this.selectedDepartmentCandidate = null;
        this.loadDepartments();
    }

    closeAssignDepartmentModal() {
        this.isAssignDepartmentOpen = false;
        this.departmentSearch = '';
        this.filteredDepartments = [];
        this.selectedDepartmentCandidate = null;
        this.isLoadingDepartments = false;
        this.isAssigningDepartment = false;
    }

    private async loadDepartments(): Promise<void> {
        try {
            this.isLoadingDepartments = true;
            const res = await this.departmentService.getByCompany(this.caseData.company_id);
            const data = (res as { data?: unknown })?.data;
            const list: Department[] = Array.isArray(data) ? data as Department[] : [];

            this.departments = list;
            this.filteredDepartments = list;
        } catch {
            this.alert.error('Error cargando departamentos');
            this.departments = [];
            this.filteredDepartments = [];
        } finally {
            this.isLoadingDepartments = false;
        }
    }

    onDepartmentSearchChange(q: string) {
        const query = (q || '').trim().toLowerCase();
        if (!query) {
            this.filteredDepartments = this.departments;
            return;
        }
        this.filteredDepartments = this.departments.filter(d =>
            (d.description || '').toLowerCase().includes(query)
        );
    }

    selectDepartmentCandidate(dep: Department) {
        this.selectedDepartmentCandidate = dep;
    }

    async confirmAssignDepartment() {
        if (!this.caseData || !this.selectedDepartmentCandidate) return;

        try {
            this.isAssigningDepartment = true;

            // TODO: implementar en tu CaseService
            await this.caseService.assignCaseToDepartment({
                case_id: this.caseData.case_id,
                department_id: this.selectedDepartmentCandidate.id,
                changed_by: this.loggedUser?.user_id || 0,
            });

            // Actualizar en UI
            (this.caseData as any).department_name = this.selectedDepartmentCandidate.description;
            (this.caseData as any).department_id = this.selectedDepartmentCandidate.id;

            this.alert.success('Departamento asignado al caso');
            this.closeAssignDepartmentModal();
        } catch (e) {
            this.alert.error('No se pudo asignar el departamento');
        } finally {
            this.isAssigningDepartment = false;
        }
    }



    ///////
    ///// Agente
    //////

    openAssignAgentModal() {
        this.isAssignAgentOpen = true;
        this.agentSearch = '';
        this.selectedAgentCandidate = null;
        this.loadAgents();
    }

    closeAssignAgentModal() {
        this.isAssignAgentOpen = false;
        this.agentSearch = '';
        this.filteredAgents = [];
        this.selectedAgentCandidate = null;
        this.isLoadingAgents = false;
        this.isAssigningAgent = false;
    }

    private async loadAgents(): Promise<void> {
        if (!this.caseData?.company_id || !this.caseData?.department_id) return;

        try {
            this.isLoadingAgents = true;

            const res = await this.agentUserService.getByCompanyAndDepartment(
                this.caseData.company_id,
                this.caseData.department_id
            );

            const data = (res as { data?: unknown })?.data;
            const list: AgentDepartmentInformation[] = Array.isArray(data) ? data : [];

            this.agents = list;
            this.filteredAgents = list;
        } catch {
            this.alert.error('Error cargando agentes');
            this.agents = [];
            this.filteredAgents = [];
        } finally {
            this.isLoadingAgents = false;
        }
    }

    onAgentSearchChange(q: string) {
        const query = (q || '').trim().toLowerCase();
        if (!query) {
            this.filteredAgents = this.agents;
            return;
        }
        this.filteredAgents = this.agents.filter(a =>
            (a.agent_name || '').toLowerCase().includes(query) ||
            (a.department_name || '').toLowerCase().includes(query)
        );
    }

    selectAgentCandidate(agent: AgentDepartmentInformation) {
        this.selectedAgentCandidate = agent;
    }

    async confirmAssignAgent() {
        if (!this.caseData || !this.selectedAgentCandidate) return;

        try {
            this.isAssigningAgent = true;

              let departmentId = Number(this.caseData.department_id) || 0;

            // 👉 Aquí deberías tener un endpoint en tu CaseService
            await this.caseService.assignCaseToAgent(
                this.caseData.case_id,
                this.selectedAgentCandidate.agent_id,
                this.loggedUser?.user_id || 0,
                departmentId
            );

            // Reflejar en UI
            this.currentAgent = this.selectedAgentCandidate;
            (this.caseData as any).agent_name = this.currentAgent.agent_name;
            (this.caseData as any).agent_id = this.currentAgent.agent_id;

            this.alert.success('Agente asignado al caso');
            this.closeAssignAgentModal();
        } catch (e) {
            this.alert.error('No se pudo asignar el agente');
        } finally {
            this.isAssigningAgent = false;
        }
    }

    ///
    /// Change stage
    ///

    // Cargar estado actual
    async loadCurrentStage(caseId: number) {
        try {
            const res = await this.caseService.getCaseFunnelCurrent(caseId);
            this.currentStage = res.data || null;
            this.currentCaseFunnel = res.data || null;
        } catch {
            this.currentStage = null;
            this.currentCaseFunnel = null;
        }
    }

    // Abrir modal de mover stage
    openChangeStatusModal(caseId: number) {
        this.loadCurrentStage(caseId);

        this.isMoveStageOpen = true;
    }

    // Confirmación desde el modal
    async onMoveStage(payload: MoveCaseStagePayload) {
        try {
            payload.changed_by = this.loggedUser?.user_id;
            await this.caseService.moveCaseStage(payload);

            this.alert.success('Etapa cambiada correctamente');
            if (payload.case_id) {
                await this.loadCurrentStage(payload.case_id);
                await this.loadHistory(payload.case_id);
            }

            this.isMoveStageOpen = false;
        } catch (err) {
            console.error(err);
            this.alert.error('No se pudo cambiar de etapa');
        }
    }

    // Historial de cambios
    async loadHistory(caseId: number) {
        // try {
        //     this.isLoadingHistory = true;
        //     const res = await this.caseData.getCaseFunnelHistory(caseId);
        //     this.history = Array.isArray(res?.data) ? res.data : [];
        // } finally {
        //     this.isLoadingHistory = false;
        // }
    }


    ////
    // Cerrar caso
    ////

    openCloseCaseModal() {
        this.isCloseCaseOpen = true;
        this.closeNote = '';
    }

    closeCloseCaseModal() {
        this.isCloseCaseOpen = false;
    }

    async confirmCloseCase() {
        if (!this.caseData) return;

        try {
            this.isClosingCase = true;

            const res = await this.caseService.closeCase(
                this.caseData.case_id,
                this.closeNote,
                this.loggedUser?.user_id || 0,
                this.caseData.funnel_id || 0
            );

            if (res.success) {
                this.alert.success('Caso cerrado correctamente');
                this.caseData.status = 'closed';

                this.closeCloseCaseModal();

                this.back.emit();
            } else {
                this.alert.error(res.message || 'No se pudo cerrar el caso');
            }
        } catch (err) {
            console.error(err);
            this.alert.error('Error al cerrar el caso');
        } finally {
            this.isClosingCase = false;
        }
    }


    

}