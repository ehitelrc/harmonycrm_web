import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { CaseService } from '@app/services/case.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AgentUserService } from '@app/services/agent-user.service';
import { User } from '@app/models/auth.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { ApiResponse } from '@app/models';
import { AgentDepartmentInformation } from '@app/models/agent-department-information.model';
import { Department } from '@app/models/department.model'; // ⚠️ Asegúrate de tener este modelo
import { DepartmentService } from '@app/services/department.service';
import { ClientService } from '@app/services/client.service';
import { Client } from '@app/models/client.model';
import { AlertService } from '@app/services/extras/alert.service';
import { ClientFormComponent } from '../clients/clients-form/client-form.component';
import { DashboardStats } from '@app/models/dashboard-stats.model';
import { CaseDashboardService } from '@app/services/case-dashboard.service';
import { interval } from 'rxjs';
import { ChatWorkspaceComponent } from '../chat/chat-workspace.component';



@Component({
  selector: 'app-dashboard-cases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClientFormComponent,
    ChatWorkspaceComponent,
    MainLayoutComponent],
  templateUrl: './dashboard-cases.component.html',
  styleUrls: ['./dashboard-cases.component.css']
})
export class DashboardCasesComponent implements OnInit {
  user: User | null = null;
  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  unassignedCases: CaseWithChannel[] = [];
  loading = false;

  // 
  dashboard: DashboardStats | null = null;

  showChatPreview = false;
  chatPreviewCase: CaseWithChannel | null = null;

  showReassignDepartmentModal = false;
  selectedNewDepartmentId: number | null = null;
  reassigningDepartment = false;

  allDepartments: Department[] = []; // Lista completa para reasignación
  caseToReassign: CaseWithChannel | null = null;


  // Modal
  showAssignModal = false;
  selectedCaseId: number | null = null;
  selectedDepartmentId: number | null = null;
  selectedAgentId: number | null = null;
  assigning = false;

  selectedShowDepartmentId: number | null = null;

  departments: Department[] = [];
  agents: AgentDepartmentInformation[] = [];

  showDepartments: Department[] = [];

  // Modal de cliente
  showClientAssignModal = false;
  showNewClientModal = false;
  selectedClientId: number | null = null;
  clients: Client[] = [];
  creatingClient = false;
  assigningClient = false;

  clientSearchTerm = '';
  searchingClients = false;
  clientResults: Client[] = [];
  selectedClient: Client | null = null;

  caseSelected: CaseWithChannel | null = null;

  intervalId: any;

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseService: CaseService,
    private agentUserService: AgentUserService,
    private languageService: LanguageService,
    private clienteService: ClientService,
    private alertService: AlertService,
    private caseDashboardService: CaseDashboardService
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;
    await this.loadCompanies();

    // 🔄 Refresca cada 30 segundos
    // this.intervalId = setInterval(async () => {
    //   if (this.selectedCompanyId) {
    //     if (this.selectedCompanyId) {
    //       await this.loadUnassignedCases();
    //       await this.loadDashboardStats();
    //     }
    //   }
    // }, 30000); // 30 segundos

  }



  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data?.length) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0].company_id;

        await this.loadDepartmentsForDisplay();

        await this.loadUnassignedCases();
        await this.loadDashboardStats();
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }
  async loadDepartmentsForDisplay(): Promise<void> {
    if (!this.selectedCompanyId) return;

    try {
      const res = await this.departmentService.getByCompanyAndUser(
        this.selectedCompanyId,
        this.user!.user_id
      );

      this.showDepartments = res.success && res.data ? res.data : [];
      this.selectedShowDepartmentId = this.showDepartments[0]?.id || null;

      // ⬇️ ESTE ES EL FIX
      if (this.selectedShowDepartmentId) {
        this.onShowDepartmentSelected();  // <-- DISPARA LA CARGA
      }

    } catch (err) {
      console.error('Error loading departments for display', err);
    }
  }

  async loadDashboardStats(): Promise<void> {
    if (!this.selectedCompanyId) return;
    try {
      const res = await this.caseDashboardService.getByCompanyAndDepartmentID(this.selectedCompanyId, this.selectedShowDepartmentId!);
      if (res.success && res.data) {
        const data = res.data;

        // 🔧 Normaliza valores nulos
        data.cases_by_channel = data.cases_by_channel || [];
        data.cases_by_agent = data.cases_by_agent || [];
        data.oldest_open_cases = data.oldest_open_cases || [];

        this.dashboard = {
          ...res.data,
          open_cases: res.data.open_cases ?? 0,
          closed_cases: res.data.closed_cases ?? 0,
          closed_today: res.data.closed_today ?? 0,
          opened_today: res.data.opened_today ?? 0,
          unassigned_agents: res.data.unassigned_agents ?? 0,
          unassigned_clients: res.data.unassigned_clients ?? 0,
          cases_by_channel: res.data.cases_by_channel || [],
          cases_by_agent: res.data.cases_by_agent || [],
          oldest_open_cases: res.data.oldest_open_cases || []
        };


        console.log('✅ Dashboard stats loaded:', this.dashboard);
      }
    } catch (err) {
      console.error('Error loading dashboard stats', err);
    }
  }

  async loadUnassignedCases(): Promise<void> {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    try {
      const response: ApiResponse<CaseWithChannel[]> =
        await this.caseService.getCasesWithoutAgentByCompanyAndDepartment(this.selectedCompanyId, this.selectedShowDepartmentId!);
      if (response.success && response.data) {
        this.unassignedCases = response.data;
      }
    } catch (error) {
      console.error('Error loading unassigned cases:', error);
    } finally {
      this.loading = false;
    }
  }

  async onCompanyChange(): Promise<void> {
    await this.loadDepartmentsForDisplay();
    // await this.loadUnassignedCases();
    // await this.loadDashboardStats();
  }

  async assignToAgent(data: any): Promise<void> {
    this.selectedCaseId = data.case_id;
    this.showAssignModal = true;
    this.selectedAgentId = null;
    this.selectedDepartmentId = null;
    this.agents = [];
    await this.loadDepartments();

  }

  async loadDepartments(): Promise<void> {
    if (!this.selectedCompanyId) return;
    try {
      const res = await this.departmentService.getByCompany(this.selectedCompanyId);
      if (res.success && res.data) {
        this.departments = res.data;
      }
    } catch (err) {
      console.error('Error loading departments', err);
    }
  }

  async onDepartmentSelected(): Promise<void> {
    if (!this.selectedDepartmentId) return;
    try {
      const res = await this.agentUserService.getAgentsByCompanyAndDepartment(
        this.selectedCompanyId!,
        this.selectedDepartmentId
      );
      if (res.success && res.data) {
        this.agents = res.data;
      } else {
        this.agents = [];
      }
    } catch (err) {
      console.error('Error loading agents by department', err);
    }
  }

  async assignAgentToCase(): Promise<void> {
    if (!this.selectedAgentId || !this.selectedCaseId || !this.user) return;
    this.assigning = true;


    let agentID = Number(this.selectedAgentId);

    try {
      let departmentId = Number(this.selectedDepartmentId) || 0;

      const res = await this.caseService.assignCaseToAgent(
        this.selectedCaseId,
        agentID,
        this.user.user_id,
        departmentId
      );
      if (res.success) {
        this.alertService.success('Case assigned successfully');
        await this.loadUnassignedCases();
        await this.loadDashboardStats();
        this.showAssignModal = false;
      } else {
        this.alertService.error('Error assigning case to agent');
      }
    } catch (error) {

      this.alertService.error('Error assigning case to agent');
    } finally {
      this.assigning = false;
    }
  }

  closeModal(): void {
    this.showAssignModal = false;
    this.showClientAssignModal = false;
  }

  async openAssignClientModal(c: CaseWithChannel): Promise<void> {

    this.caseSelected = c;
    this.selectedCaseId = c.case_id;
    this.showClientAssignModal = true;
    this.selectedClientId = null;
    await this.loadClients();
  }

  async loadClients(): Promise<void> {
    try {
      const res = await this.clienteService.getAll();
      if (res.success && res.data) {
        this.clients = res.data;
      }
    } catch (err) {
      console.error('Error loading clients', err);
    }
  }

  async assignClientToCase(): Promise<void> {
    if (!this.selectedClientId || !this.caseSelected) return;
    this.assigningClient = true;

    try {
      const res = await this.caseService.assignCaseToClient(
        this.selectedCaseId!,
        this.selectedClientId!
      );

      if (res.success) {
        this.alertService.success('Client assigned to case successfully');
        this.showClientAssignModal = false;
        await this.loadUnassignedCases();
        await this.loadDashboardStats();
      } else {
        this.alertService.error('Error assigning client to case');
      }
    } catch (error) {
      this.alertService.error('Error assigning client to case');
    } finally {
      this.assigningClient = false;
    }
  }

  // Crear nuevo cliente
  openNewClientModal(): void {
    this.showClientAssignModal = false;
    this.showNewClientModal = true;
  }

  async createClient(newClientData: any): Promise<void> {
    this.creatingClient = true;
    try {
      const res = await this.clienteService.create(newClientData);
      if (res.success) {
        alert('Cliente creado exitosamente');
        this.showNewClientModal = false;
        await this.loadUnassignedCases();
      }
    } catch (err) {
      console.error('Error creating client', err);
    } finally {
      this.creatingClient = false;
    }
  }


  async searchClients(): Promise<void> {
    if (!this.clientSearchTerm || this.clientSearchTerm.length < 2) {
      this.clientResults = [];
      return;
    }

    this.searchingClients = true;

    try {
      // Aseguramos que la lista de clientes esté cargada
      if (!this.clients || this.clients.length === 0) {
        await this.loadClients();
      }

      const term = this.clientSearchTerm.toLowerCase();

      // Filtrado local (por nombre, correo o teléfono si lo tienes)
      this.clientResults = this.clients.filter(c =>
        (c.full_name && c.full_name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term))
      );

    } catch (err) {
      console.error('Error searching clients locally', err);
    } finally {
      this.searchingClients = false;
    }
  }

  onClientCreated(newClient: Client): void {
    // Cerrar modal y volver al de asignación
    this.showNewClientModal = false;
    this.showClientAssignModal = true;

    // Actualizar lista y seleccionar automáticamente el nuevo cliente
    this.clients.push(newClient);
    this.selectedClient = newClient;
    this.selectedClientId = newClient.id;
    this.clientSearchTerm = newClient.full_name!;

    alert('Cliente creado exitosamente.');
  }

  onClientCancel(): void {
    this.showNewClientModal = false;
    this.showClientAssignModal = true;
  }

  onShowDepartmentSelected(): void {
    this.loadDashboardStats();
    this.loadUnassignedCases();

  }

  t(key: string): string {
    return this.languageService.t(key);
  }


  openChatPreview(c: CaseWithChannel) {
    this.chatPreviewCase = c;
    this.showChatPreview = true;
  }

  closeChatPreview() {
    this.showChatPreview = false;
    this.chatPreviewCase = null;
  }

  openReassignDepartmentModal(c: CaseWithChannel) {
    this.caseToReassign = c;
    this.selectedNewDepartmentId = null;
    this.showReassignDepartmentModal = true;

    this.loadAllDepartments();
  }

  closeReassignDepartmentModal() {
    this.showReassignDepartmentModal = false;
    this.caseToReassign = null;
  }

  async loadAllDepartments(): Promise<void> {
    if (!this.selectedCompanyId) return;

    try {
      const res = await this.departmentService.getByCompany(this.selectedCompanyId);
      if (res.success && res.data) {
        this.allDepartments = res.data;
        console.log('✅ All departments loaded for reassignment:', this.allDepartments);
      }
    } catch (err) {
      console.error('Error loading departments for reassignment', err);
    }
  }

  async reassignDepartment(): Promise<void> {
    if (!this.caseToReassign || !this.selectedNewDepartmentId) return;

    this.reassigningDepartment = true;

    try {
      // const res = await this.caseService.changeCaseDepartment(
      //   this.caseToReassign.case_id,
      //   this.selectedNewDepartmentId
      // );

      let newDepartemnt = Number(this.selectedNewDepartmentId);

      const res = await this.caseService.assignCaseToDepartment({
        case_id: this.caseToReassign.case_id,
        department_id: newDepartemnt,
        changed_by: this.user?.user_id || 0,
      });

      if (res.success) {
        this.alertService.success('Departamento actualizado correctamente');
        this.closeReassignDepartmentModal();
        await this.loadUnassignedCases();
        await this.loadDashboardStats();
      } else {
        this.alertService.error('Error al reasignar el departamento');
      }
    } catch (err) {
      console.error('Error reassigning department', err);
      this.alertService.error('Error al reasignar el departamento');
    } finally {
      this.reassigningDepartment = false;
    }
  }

   
}