import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { LanguageService } from '../../../services/extras/language.service';
import { AlertService } from '../../../services/extras/alert.service';


import { CompanySelectComponent } from '@app/components/shared/user-companies-select/company-select.component';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CompanyUser, UserRoleCompanyManage } from '@app/models/companies_user_view';
import { UserCompanyRolesService } from '@app/services/user-company-roles.service';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '@app/services/company.service';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AuthService } from '@app/services';
import { AgentUserFormComponent } from '../agent-user-form/agent-user-form.component';
import { AgentUser } from '@app/models/agent_user.models';
import { AgentUserService } from '@app/services/agent-user.service';
import { AgentDepartmentAssignment } from '@app/models/agent_department_assignment_view';

@Component({
  selector: 'app-agent-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-user-list.component.html',
  styleUrls: ['./agent-user-list.component.css']
})
export class AgentUserListComponent implements OnInit {

  @Input() users: AgentUser[] = [];
  @Input() isLoading = false;
  @Output() refresh = new EventEmitter<void>();

  editingUser: AgentUser | null = null;
  viewingUser: AgentUser | null = null;
  deletingUserId: number | null = null;
  isDeleting = false;
  changingPasswordUser: AgentUser | null = null;

  loggedUser: UserAuthModel | null = null;


  loadingRoles = false;
  companies: CompanyUser[] = [];
  selectedCompany: number | null = null;
  userRoles: UserRoleCompanyManage[] = [];

  loadingCompanies = false;


  departments: AgentDepartmentAssignment[] = [];





  constructor(
    private agentUserService: AgentUserService,
    private languageService: LanguageService,
    private alertService: AlertService,
    private authService: AuthService,
    private companyUserRolesService: UserCompanyRolesService,
    private companyService: CompanyService
  ) {


  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  ngOnInit() {
    this.loggedUser = this.authService.getCurrentUser();
    console.log('Logged user:', this.loggedUser);

  }

  getInitials(firstName?: string | null, lastName?: string | null): string {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    const variants = {
      admin: "bg-[#00113f] text-white",
      operator: "bg-gray-500 text-white",
    } as const;

    return variants[role as keyof typeof variants] || "bg-gray-500 text-white";
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  getUserDisplayName(user: AgentUser): string {
    if (user.full_name) {
      return `${user.full_name || ""}`.trim();
    }
    return user.email || user.id.toString();
  }

  onEdit(user: AgentUser): void {
    this.editingUser = user;
  }

  onView(user: AgentUser): void {
    this.viewingUser = user;
    this.companies = [];
    this.selectedCompany = null;
    this.userRoles = [];

    this.loadCompanies();

  }

  loadCompanies() {
    if (!this.viewingUser) return;
    this.companies = [];

    console.log('Loading companies for user:', this.viewingUser.id);

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

  onDelete(userId: number): void {
    this.deletingUserId = userId;
  }

  onChangePassword(user: AgentUser): void {
    this.changingPasswordUser = user;
  }

  closeEditDialog(): void {
    this.editingUser = null;
  }

  closeViewDialog(): void {
    this.viewingUser = null;
    this.selectedCompany = null;
    this.userRoles = [];
    this.loadingRoles = false;
    this.companies = [];
  }

  closeDeleteDialog(): void {
    this.deletingUserId = null;
  }

  closePasswordDialog(): void {
    this.changingPasswordUser = null;
  }

  onEditSuccess(): void {
    this.closeEditDialog();
    this.refresh.emit();
  }

  onPasswordChangeSuccess(): void {
    this.closePasswordDialog();
  }

  async confirmDelete(): Promise<void> {
    if (!this.deletingUserId) return;

    this.isDeleting = true;

    try {
      const response = await this.agentUserService.delete(this.deletingUserId);

      if (response.success) {
        this.alertService.success(
          this.t('agent_user_management.success'),
          this.t('agent_user_management.user_deleted')
        );
        this.refresh.emit();
      } else {
        throw new Error(response.message || this.t('delete_failed'));
      }
    } catch (error: any) {
      let errorMessage = this.t('agent_user_management.failed_delete');
      let errorTitle = this.t('agent_user_management.error');

      // Parse specific error messages
      if (error.message?.includes('Cannot delete user')) {
        errorTitle = this.t('agent_user_management.cannot_delete');
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.alertService.error(errorTitle, errorMessage);
    } finally {
      this.isDeleting = false;
      this.closeDeleteDialog();
    }
  }

  // Authorization methods
  isAdmin(): boolean {

    return true
    //return this.authService.isAdmin();
  }



  // Se llama cuando se selecciona la compañía desde <app-company-select>
  onCompanySelected(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCompany = value ? +value : null;

    if (this.selectedCompany && this.viewingUser) {
      this.loadDepartments(this.selectedCompany, this.viewingUser.id);
    }
  }


  async loadDepartments(companyId: number, userId: number) {
    this.loadingRoles = true;
    this.departments = [];
    try {
      const response = await this.agentUserService.companiesDepartments(companyId, userId);
      if (response.success) {
        this.departments = response.data;
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (err: any) {
      this.alertService.error(this.t('agent_user_management.error'), err.message || 'Error al cargar departamentos');
    } finally {
      this.loadingRoles = false;
    }
  }


  toggleDepartment(departmentId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.departments = this.departments.map(d =>
      d.department_id === departmentId ? { ...d, department_assigned: checked } : d
    );
  }

  async saveAssignments() {
    if (!this.viewingUser || !this.selectedCompany) {
      this.alertService.error(this.t('agent_user_management.error'), this.t('agent_user_management.no_user_or_company'));
      return;
    }

    try {
      const response = await this.agentUserService.updateAssignments(this.viewingUser.id, this.selectedCompany, this.departments);
      if (response.success) {
        this.alertService.success(
          this.t('agent_user_management.success'),
          this.t('agent_user_management.departments_updated')
        );
        this.closeViewDialog();
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (err: any) {
      this.alertService.error(this.t('agent_user_management.error'), err.message || 'Error al actualizar departamentos');
    }
  }
}
