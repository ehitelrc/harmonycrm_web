import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';
import { CaseService, VwCaseCurrentStage } from '@app/services/case.service';
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

@Component({
    selector: 'app-case-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClientFormComponent
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



    constructor(
        private caseService: CaseService,
        private authService: AuthService,
        private alert: AlertService,
        private lang: LanguageService,
        private clientService: ClientService,


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
         if ( !this.selectedClientCandidate) return;

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


}