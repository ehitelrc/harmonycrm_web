import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  NgZone
} from '@angular/core';

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

import { CaseDashboardService } from '@app/services/case-dashboard.service';

import { ChatWorkspaceComponent } from '../chat/chat-workspace.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';


import { CaseStatsResponse } from '@app/models/case-stats.model';



@Component({
  selector: 'app-dashboard-cases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ClientFormComponent,
    ChatWorkspaceComponent,
    MainLayoutComponent,
    ScrollingModule
  ],
  templateUrl: './dashboard-cases.component.html',
  styleUrls: ['./dashboard-cases.component.css']
})
export class DashboardCasesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('unassignedViewport')
  unassignedViewport?: CdkVirtualScrollViewport;

  @ViewChild('assignedViewport')
  assignedViewport?: CdkVirtualScrollViewport;

  currentPage = 1;
  pageSize = 25;

  isLoadingPage = false;
  hasMorePages = true;

  private resizeObserver?: ResizeObserver;

  filteredUnassignedCasesCache: CaseWithChannel[] = [];
  filteredAssignedCasesCache: CaseWithChannel[] = [];
  private filterTimeout: any;

  itemSize = "120"


  user: User | null = null;
  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;




  data: CaseWithChannel[] = [];
  unassignedCases: CaseWithChannel[] = [];
  assignedCases: CaseWithChannel[] = [];
  loading = false;

  filterUnassigned: string = '';
  filterAssigned: string = '';

  casesByChannel: {
    channel: string;
    total: number;
    assigned: number;
    unassigned: number;
  }[] = [];

  casesByAgent: {
    agent: string;
    total: number;
    percent?: number;
  }[] = [];
  // 

  totalCasesGlobal = 0;

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


  menuContext: {
    case: any;
    type: 'unassigned' | 'assigned';
  } | null = null;

  menuPosition = { top: 0, left: 0 };


  constructor(
    private el: ElementRef,
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseService: CaseService,
    private agentUserService: AgentUserService,
    private languageService: LanguageService,
    private clienteService: ClientService,
    private alertService: AlertService,
    // private caseDashboardService: CaseDashboardService,
    // private caseStatsService: CaseStatsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;
    await this.loadCompanies();
  }

  ngAfterViewInit(): void {
    this.observeViewportResize();
  }



  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }


  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data?.length) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0].company_id;

        await this.loadDepartmentsForDisplay();

        await this.loadCasesByCompanyAndDepartment();

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

  async loadCasesByCompanyAndDepartment(): Promise<void> {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const response: ApiResponse<CaseWithChannel[]> =
        await this.caseService.getOpenCasesByCompanyAndDepartmen(
          this.selectedCompanyId,
          this.selectedShowDepartmentId!
        );


      // const response = await this.caseService.getOpenCasesMV(
      //   this.selectedCompanyId,
      //   this.selectedShowDepartmentId!,
      //   this.currentPage,
      //   this.pageSize
      // );
      if (response.success && response.data) {

        // Normalizar showMenu
        const allCases = response.data.map(c => ({
          ...c,
          showMenu: false
        }));

        // Separar casos
        // this.assignedCases = allCases.filter(c => c.agent_assigned === true);
        // this.unassignedCases = allCases.filter(c => c.agent_assigned === false);
        this.unassignedCases = allCases
          .filter(c => !c.agent_assigned)
          .map(c => ({
            ...c,
            _searchText: [
              c.client_name,
              c.sender_id,
              c.integration_name,
              c.last_message_text,
              c.case_id
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          }));

        this.assignedCases = allCases
          .filter(c => c.agent_assigned)
          .map(c => ({
            ...c,
            _searchText: [
              c.client_name,
              c.sender_id,
              c.agent_full_name,
              c.integration_name,
              c.last_message_text,
              c.case_id
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          }));

        this.unassignedViewport?.scrollToIndex(0);
        this.assignedViewport?.scrollToIndex(0);

        // this.applyUnassignedFilter();
        // this.applyAssignedFilter();

        this.filteredUnassignedCasesCache = [...this.unassignedCases];
        this.filteredAssignedCasesCache = [...this.assignedCases];

        // 🔥 FORZAR REDIBUJO

        //this.cdr.detectChanges();
        this.refreshViewports();
        this.cdr.markForCheck();

        // Asignar todos los casos a this.data
        this.data = allCases;

        // 🔥 CORREGIDO: total de casos se calcula DESPUÉS de tener allCases
        this.totalCasesGlobal = allCases.length;

        // 🔥 CORREGIDO: ahora sí calcular estadísticas
        this.computeCasesByChannel();
        this.computeCasesByAgent();
      }

    } catch (error) {
      console.error('Error loading cases by company and department:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private refreshViewports(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.unassignedViewport?.checkViewportSize();
        this.assignedViewport?.checkViewportSize();
      });
    });
  }


  async loadUnassignedCases(): Promise<void> {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    try {
      const response: ApiResponse<CaseWithChannel[]> =
        await this.caseService.getCasesWithoutAgentByCompanyAndDepartment(this.selectedCompanyId, this.selectedShowDepartmentId!);
      if (response.success && response.data) {
        //this.unassignedCases = response.data;
        this.unassignedCases = response.data.map(c => ({
          ...c,
          showMenu: false   // 👈 AQUÍ SE AGREGA
        }));
      }
    } catch (error) {
      console.error('Error loading unassigned cases:', error);
    } finally {
      this.loading = false;
    }
  }

  async onCompanyChange(): Promise<void> {
    await this.loadDepartmentsForDisplay();

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
    if (!this.selectedDepartmentId) {
      this.agents = [];
      this.selectedAgentId = null;
      return;
    }

    // 🔥 FIX CLAVE: LIMPIEZA INMEDIATA
    this.agents = [];
    this.selectedAgentId = null;
    this.cdr.markForCheck(); // repaint inmediato

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
      this.agents = [];
    } finally {
      this.cdr.markForCheck();
    }
  }

  async assignAgentToCase(): Promise<void> {
    if (!this.selectedAgentId || !this.selectedCaseId || !this.user) return;
    this.assigning = true;


    this.cdr.markForCheck(); // 🔥 asegura repaint inmediato del botón

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

        // 🔥 cerrar modal ANTES de cargas pesadas
        this.showAssignModal = false;
        this.assigning = false;

        // 🔥 FORZAR repaint inmediato
        this.cdr.detectChanges();

        this.loadCasesByCompanyAndDepartment();

        //await this.loadUnassignedCases();
        // await this.loadDashboardStats();
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

  async onShowDepartmentSelected(): Promise<void> {
    this.unassignedCases = [];
    this.assignedCases = [];
    this.filteredUnassignedCasesCache = [];
    this.filteredAssignedCasesCache = [];
    this.filterUnassigned = '';
    this.filterAssigned = '';

    // Cancela filtros pendientes
    clearTimeout(this.filterTimeout);

    this.loading = true;
    this.cdr.markForCheck();

    await this.loadCasesByCompanyAndDepartment();


  }

  // async loadStats(): Promise<void> {
  //   if (!this.selectedCompanyId || !this.selectedShowDepartmentId) return;

  //   try {
  //     const res = await this.caseStatsService.getStats(
  //       this.selectedCompanyId,
  //       this.selectedShowDepartmentId
  //     );

  //     if (res.success && res.data) {
  //       this.stats = res.data;
  //     }
  //   } catch (err) {
  //     console.error('Error loading case stats', err);
  //   }
  // }

  t(key: string): string {
    return this.languageService.t(key);
  }


  openChatPreview(c: CaseWithChannel) {
    //this.chatPreviewCase = c;
    this.chatPreviewCase = { ...c };
    this.showChatPreview = true;

    this.cdr.markForCheck();

  }

  closeChatPreview() {
    this.showChatPreview = false;
    this.chatPreviewCase = null;

    this.cdr.markForCheck();
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


  toggleMenu(c: CaseWithChannel) {
    c.showMenu = !c.showMenu;

    [...this.unassignedCases, ...this.assignedCases].forEach(x => {
      if (x !== c) x.showMenu = false;
    });
  }

  @HostListener('document:click')
  closeAllMenus() {
    [...this.unassignedCases, ...this.assignedCases].forEach(c => c.showMenu = false);
  }

  @HostListener('document:keydown.escape')
  closeAllMenusESC() {
    this.closeAllMenus();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.menuContext) {
      this.menuContext = null;
      this.cdr.markForCheck();
    }
  }

  private groupByCount<T>(
    items: T[],
    keyFn: (item: T) => string | null | undefined
  ): { label: string; count: number }[] {

    const map = new Map<string, number>();

    for (const item of items) {
      const key = keyFn(item)?.trim() || 'Sin nombre';
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }


  private computeCasesByChannel() {
    const channelMap = new Map<
      string,
      { total: number; assigned: number; unassigned: number }
    >();

    for (const c of this.data) {
      const channel = c.integration_name?.trim() || "Sin canal";

      if (!channelMap.has(channel)) {
        channelMap.set(channel, { total: 0, assigned: 0, unassigned: 0 });
      }

      const entry = channelMap.get(channel)!;

      entry.total++;
      if (c.agent_assigned) entry.assigned++;
      else entry.unassigned++;
    }

    this.casesByChannel = Array.from(channelMap.entries()).map(
      ([channel, values]) => ({
        channel,
        ...values
      })
    );
  }

  computeCasesByAgent() {
    if (!this.data || this.data.length === 0) {
      this.casesByAgent = [];
      return;
    }

    const map = new Map<string, number>();

    for (const c of this.data) {
      if (!c.agent_full_name) continue; // Solo agentes asignados

      const key = c.agent_full_name;
      map.set(key, (map.get(key) || 0) + 1);
    }

    this.casesByAgent = [...map.entries()].map(([agent, total]) => ({
      agent,
      total,
      percent: this.totalCasesGlobal
        ? Math.round((total * 100) / this.totalCasesGlobal)
        : 0
    }));
  }

  // 👇 debajo de computeCasesByChannel()
  getAssignedPercent(ch: { total: number; assigned: number; unassigned: number }): number {
    if (!ch || !ch.total) return 0;
    const pct = (ch.assigned * 100) / ch.total;
    return Math.round(pct); // por si querés un entero
  }

  getChannelPercent(ch: { total: number }): number {
    if (!this.totalCasesGlobal) return 0;
    return Math.round((ch.total * 100) / this.totalCasesGlobal);
  }

  getAgentPercent(agent: { total: number }): number {
    if (!this.totalCasesGlobal) return 0;
    return Math.round((agent.total * 100) / this.totalCasesGlobal);
  }


  async refreshDashboard(manual = false) {
    if (!this.selectedCompanyId || !this.selectedShowDepartmentId) return;

    // 🧠 Evita doble carga
    if (this.loading) return;


    await this.loadCasesByCompanyAndDepartment();

    console.log(
      manual
        ? '🔁 Refresco manual ejecutado'
        : '♻️ Refresco automático ejecutado'
    );
  }


  applyUnassignedFilter(): void {
    const term = this.filterUnassigned.toLowerCase().trim();

    this.filteredUnassignedCasesCache = !term
      ? [...this.unassignedCases]
      : this.unassignedCases.filter(c =>
        (c._searchText ?? '').includes(term)
      );

    this.cdr.markForCheck();
  }


  applyAssignedFilter(): void {
    const term = this.filterAssigned.toLowerCase().trim();

    this.filteredAssignedCasesCache = !term
      ? [...this.assignedCases]
      : this.assignedCases.filter(c =>
        (c._searchText ?? '').includes(term)
      );
  }

  private toTimestamp(date?: string | null): number {
    if (!date) return 0; // fechas nulas van al fondo
    const t = new Date(date).getTime();
    return isNaN(t) ? 0 : t;
  }

  trackByCaseId(_: number, item: CaseWithChannel) {
    return item.case_id;
  }

  private observeViewportResize(): void {
    if (!this.unassignedViewport || !this.assignedViewport) return;

    const elements = [
      this.unassignedViewport.elementRef.nativeElement,
      this.assignedViewport.elementRef.nativeElement,
    ];

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          this.unassignedViewport?.checkViewportSize();
          this.assignedViewport?.checkViewportSize();
        });
      });

      elements.forEach(el => this.resizeObserver!.observe(el));
    });
  }


  openMenu(event: MouseEvent, c: any, type: 'unassigned' | 'assigned') {
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();

    this.menuPosition = {
      top: rect.bottom + 6,
      left: rect.right - 160
    };

    this.menuContext = { case: c, type };

    this.cdr.markForCheck(); // 🔥 ESTA LÍNEA ES LA CLAVE
  }

  closeMenu() {
    this.menuContext = null;
    this.cdr.markForCheck();
  }

}