import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { DepartmentService } from '@app/services/department.service';
import { CaseService } from '@app/services/case.service';
import { AgentUserService } from '@app/services/agent-user.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { User } from '@app/models/auth.model';
import { Department } from '@app/models/department.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { AgentDepartmentInformation } from '@app/models/agent-department-information.model';

@Component({
    selector: 'app-cases-mass-reassignment',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FormsModule,
        MainLayoutComponent
    ],
    templateUrl: './cases-mass-reassignment.component.html',
    styleUrls: ['./cases-mass-reassignment.component.css']
})
export class CasesMassReassignmentComponent implements OnInit {
    user: User | null = null;

    // Data State
    companies: { company_id: number; company_name: string }[] = [];
    departments: Department[] = [];
    agents: AgentDepartmentInformation[] = [];
    cases: CaseWithChannel[] = [];

    // Selection State
    selectedCompanyId: number | null = null;
    selectedDepartmentId: number | null = null;

    loading = false;

    // Filter
    searchTerm = '';

    // Bulk Reassignment Modal State
    showReassignModal = false;
    step = 1; // 1: Source Agent, 2: Select Cases, 3: Target Agent, 4: Confirm, 5: Summary

    sourceAgentId: number | null = null;
    targetAgentId: number | null = null;

    sourceAgentCases: CaseWithChannel[] = [];
    selectedCaseIds: Set<number> = new Set();

    isProcessing = false;
    progress = 0;

    // Summary Report
    reassignmentSummary: {
        total: number;
        success: number;
        failed: number;
        details: { caseId: number; success: boolean; error?: string }[];
    } | null = null;

    constructor(
        private authService: AuthService,
        private companyService: CompanyService,
        private departmentService: DepartmentService,
        private caseService: CaseService,
        private agentUserService: AgentUserService,
        private alertService: AlertService,
        private languageService: LanguageService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit(): Promise<void> {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            await this.loadCompanies();
        }
    }

    // --- Initial Data Loading ---

    async loadCompanies(): Promise<void> {
        try {
            const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
            if (response?.success && response.data?.length) {
                this.companies = response.data;
                this.selectedCompanyId = this.companies[0].company_id;
                await this.onCompanyChange();
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    }

    async onCompanyChange(): Promise<void> {
        if (!this.selectedCompanyId) return;
        try {
            const res = await this.departmentService.getByCompanyAndUser(
                this.selectedCompanyId,
                this.user!.user_id
            );
            this.departments = res.success && res.data ? res.data : [];
            if (this.departments.length > 0) {
                this.selectedDepartmentId = this.departments[0].id;
                await this.onDepartmentDetailChange();
            } else {
                this.selectedDepartmentId = null;
                this.cases = [];
                this.agents = [];
            }
        } catch (err) {
            console.error('Error loading departments', err);
        }
    }

    async onDepartmentDetailChange(): Promise<void> {
        await Promise.all([
            this.loadCases(),
            this.loadAgents()
        ]);
    }

    async loadCases(): Promise<void> {
        if (!this.selectedCompanyId || !this.selectedDepartmentId) return;
        this.loading = true;
        this.cdr.markForCheck();

        try {
            // Reutilizamos el servicio que trae casos por depto
            // Nota: El requerimiento dice "Cargar todos los casos asignados"
            // getOpenCasesByCompanyAndDepartmen trae asignados y no asignados. Filtraremos en UI o aqui.
            const response = await this.caseService.getOpenCasesByCompanyAndDepartmen(
                this.selectedCompanyId,
                this.selectedDepartmentId
            );

            if (response.success && response.data) {
                // Filtrar solo asignados si es lo que se desea, o mostrar todos.
                // El requerimiento dice "Cargar todos los casos asignados en la pantalla"
                this.cases = response.data.filter(c => c.agent_assigned);
            } else {
                this.cases = [];
            }
        } catch (error) {
            console.error('Error loading cases:', error);
            this.cases = [];
        } finally {
            this.loading = false;
            this.cdr.markForCheck();
        }
    }

    async loadAgents(): Promise<void> {
        if (!this.selectedCompanyId || !this.selectedDepartmentId) return;
        try {
            const res = await this.agentUserService.getAgentsByCompanyAndDepartment(
                this.selectedCompanyId,
                this.selectedDepartmentId
            );
            this.agents = res.success && res.data ? res.data : [];
        } catch (err) {
            console.error('Error loading agents', err);
            this.agents = [];
        }
    }

    // --- Helpers ---

    get filteredCases(): CaseWithChannel[] {
        if (!this.searchTerm) return this.cases;
        const term = this.searchTerm.toLowerCase();
        return this.cases.filter(c =>
            c.client_name?.toLowerCase().includes(term) ||
            c.agent_full_name?.toLowerCase().includes(term) ||
            c.case_id.toString().includes(term)
        );
    }

    getAgentName(id: number | null): string {
        if (!id) return '...';
        const agent = this.agents.find(a => a.agent_id == id);
        return agent ? agent.agent_name : 'Desconocido';
    }

    // --- Modal Logic ---

    openReassignModal(): void {
        this.showReassignModal = true;
        this.resetModalState();
    }

    closeReassignModal(): void {
        this.showReassignModal = false;
        this.resetModalState();
    }

    resetModalState(): void {
        this.step = 1;
        this.sourceAgentId = null;
        this.targetAgentId = null;
        this.sourceAgentCases = [];
        this.selectedCaseIds.clear();
        this.isProcessing = false;
        this.progress = 0;
        this.reassignmentSummary = null;
    }

    // Step 1 -> 2
    onSourceAgentSelected(): void {
        if (!this.sourceAgentId) return;

        // Filtrar casos del agente seleccionado desde la lista general cargada
        this.sourceAgentCases = this.cases.filter(c => c.agent_id == this.sourceAgentId);
        this.selectedCaseIds.clear();
        this.step = 2;
    }

    // Step 2 Logic
    toggleCaseSelection(caseId: number): void {
        if (this.selectedCaseIds.has(caseId)) {
            this.selectedCaseIds.delete(caseId);
        } else {
            this.selectedCaseIds.add(caseId);
        }
    }

    toggleAllCases(event: any): void {
        if (event.target.checked) {
            this.sourceAgentCases.forEach(c => this.selectedCaseIds.add(c.case_id));
        } else {
            this.selectedCaseIds.clear();
        }
    }

    isAllSelected(): boolean {
        return this.sourceAgentCases.length > 0 && this.selectedCaseIds.size === this.sourceAgentCases.length;
    }

    // Step 2 -> 3
    goToTargetAgentSelection(): void {
        if (this.selectedCaseIds.size === 0) return;
        this.step = 3;
    }

    // Step 3 -> 4
    goToConfirmation(): void {
        if (!this.targetAgentId) return;
        if (this.sourceAgentId == this.targetAgentId) {
            this.alertService.error(this.t('mass_reassignment.error.same_agent'));
            return;
        }
        this.step = 4;
    }

    // Execute
    async executeReassignment(): Promise<void> {
        if (!this.targetAgentId || !this.user) return;

        this.isProcessing = true;
        const caseIds = Array.from(this.selectedCaseIds);
        const total = caseIds.length;
        let processed = 0;

        this.reassignmentSummary = {
            total,
            success: 0,
            failed: 0,
            details: []
        };

        const targetAgentId = Number(this.targetAgentId);
        const departmentId = Number(this.selectedDepartmentId) || 0;

        for (const caseId of caseIds) {
            try {
                await this.caseService.assignCaseToAgent(
                    caseId,
                    targetAgentId,
                    this.user.user_id,
                    departmentId
                );
                this.reassignmentSummary.success++;
                this.reassignmentSummary.details.push({ caseId, success: true });
            } catch (err) {
                console.error(`Error reassigning case ${caseId}`, err);
                this.reassignmentSummary.failed++;
                this.reassignmentSummary.details.push({ caseId, success: false, error: 'Error desconocido' });
            } finally {
                processed++;
                this.progress = Math.round((processed / total) * 100);
                this.cdr.markForCheck();
            }
        }

        this.isProcessing = false;
        this.step = 5; // Show Summary

        // Refresh main list in background
        this.loadCases();
    }

    t(key: string): string {
        return this.languageService.translate(key);
    }
}
