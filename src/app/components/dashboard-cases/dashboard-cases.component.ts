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


@Component({
  selector: 'app-dashboard-cases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

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

  // Modal
  showAssignModal = false;
  selectedCaseId: number | null = null;
  selectedDepartmentId: number | null = null;
  selectedAgentId: number | null = null;
  assigning = false;

  departments: Department[] = [];
  agents: AgentDepartmentInformation[] = [];

  // Modal de cliente
  showClientAssignModal = false;
  showNewClientModal = false;
  selectedClientId: number | null = null;
  clients: Client[] = [];
  creatingClient = false;
  assigningClient = false;

  clientSearchTerm = '';
  searchingClients = false;
  clientResults:  Client[] = [];
  selectedClient: Client | null = null;

  caseSelected: CaseWithChannel | null = null;

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseService: CaseService,
    private agentUserService: AgentUserService,
    private languageService: LanguageService,
    private clienteService: ClientService,
    private alertService: AlertService
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;
    await this.loadCompanies();
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data?.length) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0].company_id;
        await this.loadUnassignedCases();
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async loadUnassignedCases(): Promise<void> {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    try {
      const response: ApiResponse<CaseWithChannel[]> =
        await this.caseService.getCasesWithoutAgentByCompany(this.selectedCompanyId);
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
    await this.loadUnassignedCases();
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
      const res = await this.caseService.assignCaseToAgent(
        this.selectedCaseId,
        agentID,
        this.user.user_id
      );
      if (res.success) {
        this.alertService.success('Case assigned successfully');
        await this.loadUnassignedCases();
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

  t(key: string): string {
    return this.languageService.t(key);
  }
}