import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';
import { CaseService, VwCaseCurrentStage } from '@app/services/case.service';
import { CaseNoteView } from '@app/models/case-notes-view.model';
import { Client } from '@app/models/client.model';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CaseNote } from '@app/models/case-notes.model';
import { AuthService, LanguageService } from '@app/services';

@Component({
    selector: 'app-case-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
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


    constructor(
        private caseService: CaseService,
        private authService: AuthService,

    ) { }



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

    }

    openAssignClientModal() {
       
    }

}