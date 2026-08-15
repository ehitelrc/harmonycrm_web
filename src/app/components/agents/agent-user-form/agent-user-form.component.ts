import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LanguageService } from '../../../services/extras/language.service';
import { AlertService } from '../../../services/extras/alert.service';
import { AgentUser } from '@app/models/agent_user.models';
import { AgentUserService } from '@app/services/agent-user.service';
import { CompanyService } from '@app/services/company.service';
import { DepartmentService } from '@app/services/department.service';
import { RoleService } from '@app/services/role.service';
import { Company } from '@app/models/company.model';
import { Role } from '@app/models/role.model';
import { Department } from '@app/models/department.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-agent-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agent-user-form.component.html',
  styleUrls: ['./agent-user-form.component.css']
})
export class AgentUserFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  activeTab: 'create' | 'convert' = 'create';
  
  // Tab 1: Create Form
  agentForm!: FormGroup;
  companies: Company[] = [];
  roles: Role[] = [];
  departments: Department[] = [];
  selectedDepartmentIds: number[] = [];

  // Tab 2: Convert List
  users: AgentUser[] = [];
  isLoading = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private agentUserService: AgentUserService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private roleService: RoleService,
    private alertService: AlertService,
    private languageService: LanguageService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  initForm(): void {
    this.agentForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', [Validators.required]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      company_id: ['', [Validators.required]],
      role_id: ['', [Validators.required]]
    });
  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.resetAll();
      this.loadInitialData();
    }
  }

  async ngOnInit(): Promise<void> {
    if (this.isOpen) {
      await this.loadInitialData();
    }
  }

  resetAll(): void {
    this.activeTab = 'create';
    this.agentForm.reset();
    this.selectedDepartmentIds = [];
    this.departments = [];
    this.users = [];
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      // Load companies
      const compRes = await this.companyService.getAllCompanies();
      if (compRes.success) {
        this.companies = compRes.data;
      }
      
      // Load roles
      const roleRes = await this.roleService.getAll();
      if (roleRes.success) {
        this.roles = roleRes.data;
        // Default to the first role that is 'operator' if found
        const operatorRole = this.roles.find(r => r.name.toLowerCase() === 'operator');
        if (operatorRole) {
          this.agentForm.patchValue({ role_id: operatorRole.id });
        }
      }

      // Pre-select current active company and load its departments
      const activeCompanyId = this.authService.getStoredAuthData()?.company_id;
      if (activeCompanyId) {
        const exists = this.companies.some(c => c.id === activeCompanyId);
        if (exists) {
          this.agentForm.patchValue({ company_id: activeCompanyId });
          await this.loadDepartmentsForCompany(activeCompanyId);
        }
      }

      // If activeTab is 'convert', also load non-agents
      if (this.activeTab === 'convert') {
        await this.loadNonAgents();
      }
    } catch (err: any) {
      this.alertService.error(this.t('agent_user_management.error'), err.message || 'Error al cargar datos iniciales');
    } finally {
      this.isLoading = false;
    }
  }

  async switchTab(tab: 'create' | 'convert'): Promise<void> {
    this.activeTab = tab;
    if (tab === 'convert' && this.users.length === 0) {
      await this.loadNonAgents();
    }
  }

  async loadDepartmentsForCompany(companyId: number): Promise<void> {
    this.departments = [];
    this.selectedDepartmentIds = [];
    if (!companyId) return;

    this.isLoading = true;
    try {
      const deptRes = await this.departmentService.getByCompany(companyId);
      if (deptRes.success) {
        this.departments = deptRes.data;
      }
    } catch (err: any) {
      this.alertService.error(this.t('agent_user_management.error'), err.message || 'Error al cargar departamentos');
    } finally {
      this.isLoading = false;
    }
  }

  async onCompanyChange(event: Event): Promise<void> {
    const companyId = +(event.target as HTMLSelectElement).value;
    await this.loadDepartmentsForCompany(companyId);
  }

  onDepartmentToggle(deptId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDepartmentIds.push(deptId);
    } else {
      this.selectedDepartmentIds = this.selectedDepartmentIds.filter(id => id !== deptId);
    }
  }

  async onSubmitCreate(): Promise<void> {
    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const payload = {
        ...this.agentForm.value,
        company_id: +this.agentForm.value.company_id,
        role_id: +this.agentForm.value.role_id,
        department_ids: this.selectedDepartmentIds
      };

      const res = await this.agentUserService.createUnifiedAgent(payload);
      if (res.success) {
        this.alertService.success(
          this.t('agent_user_management.success'),
          'Agente creado y configurado correctamente'
        );
        this.success.emit();
        this.close();
      } else {
        this.alertService.error(this.t('agent_user_management.error'), res.message);
      }
    } catch (err: any) {
      this.alertService.error(this.t('agent_user_management.error'), err.message || 'Error al crear agente');
    } finally {
      this.isSubmitting = false;
    }
  }

  async loadNonAgents(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.agentUserService.getAllNonAgents();
      if (response.success) {
        this.users = response.data;
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (error: any) {
      this.alertService.error(this.t('agent_user_management.error'), error.message || 'Error al cargar usuarios');
    } finally {
      this.isLoading = false;
    }
  }

  async convertToAgent(user: AgentUser): Promise<void> {
    this.isSubmitting = true;
    try {
      const response = await this.agentUserService.create(user.id);
      if (response.success) {
        this.alertService.success(
          this.t('agent_user_management.success'),
          this.t('agent_user_management.user_converted')
        );
        this.success.emit();
        this.close();
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (error: any) {
      this.alertService.error(this.t('agent_user_management.error'), error.message || 'Error al convertir en agente');
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.resetAll();
    this.closed.emit();
  }
}
