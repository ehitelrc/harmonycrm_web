import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
 
import { UserService } from '../../../services/user.service';
import { LanguageService } from '../../../services/extras/language.service';
import { AlertService } from '../../../services/extras/alert.service';


import { PasswordChangeComponent } from '../password-change/password-change.component';
import { CompanySelectComponent } from '@app/components/shared/user-companies-select/company-select.component';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CompanyUser, UserRoleCompanyManage } from '@app/models/companies_user_view';
import { UserCompanyRolesService } from '@app/services/user-company-roles.service';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '@app/services/company.service';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AuthService } from '@app/services';
import { RolesFormComponent } from '../roles-form/roles-form.component';
import { Role } from '@app/models/role.model';
import { RoleService } from '@app/services/role.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
 
    FormsModule,
    RolesFormComponent,
  ],

  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css']
})
export class RolesListComponent implements OnInit {

  @Input() roles: Role[] = [];
  @Input() isLoading = false;
  @Output() refresh = new EventEmitter<void>();

  editingRole: Role | null = null;
  viewingRole: Role | null = null;
  deletingRoleId: number | null = null;
  isDeleting = false;
 
  loggedUser: UserAuthModel | null = null;


  loadingRoles = false;
  companies: CompanyUser[] = [];
  selectedCompany: number | null = null;
  userRoles: UserRoleCompanyManage[] = [];

  loadingCompanies = false;


  constructor(
    private roleService: RoleService,
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

 

  onEdit(role: Role): void {
    this.editingRole = role;
  }

  onView(user: Role): void {
    this.viewingRole = user;
    this.companies = [];
    this.selectedCompany = null;
    this.userRoles = [];

    this.loadCompanies();

  }

  loadCompanies() {
    if (!this.viewingRole) return;
    this.companies = [];

    console.log('Loading companies for role:', this.viewingRole.id);

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
    this.deletingRoleId = userId;
  }
 

  closeEditDialog(): void {
    this.editingRole = null;
  }

  closeViewDialog(): void {
    this.viewingRole = null;
    this.selectedCompany = null;
    this.userRoles = [];
    this.loadingRoles = false;
    this.companies = [];
  }

  closeDeleteDialog(): void {
    this.deletingRoleId = null;
  }

 

  onEditSuccess(): void {
    this.closeEditDialog();
    this.refresh.emit();
  }
 
  async confirmDelete(): Promise<void> {
    if (!this.deletingRoleId) return;

    this.isDeleting = true;

    try {
      const response = await this.roleService.delete(this.deletingRoleId);

      if (response.success) {
        this.alertService.success(
          this.t('role_management.success'),
          this.t('role_management.role_deleted')
        );
        this.refresh.emit();
      } else {
        throw new Error(response.message || this.t('delete_failed'));
      }
    } catch (error: any) {
      let errorMessage = this.t('roles_management.failed_delete');
      let errorTitle = this.t('roles_management.error');

      // Parse specific error messages
      if (error.message?.includes('Cannot delete user')) {
        errorTitle = this.t('roles_management.cannot_delete');
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

    this.loadRoles(this.selectedCompany!, this.viewingRole!.id);
  }

  loadRoles(companyId: number, userId: number) {
    if (!companyId || !userId) return;

    this.loadingRoles = true;
    this.userRoles = [];
    this.companyUserRolesService.getRolesByUserAndCompany(userId, companyId).then(response => {
      if (response && response.data) {
        this.userRoles = response.data;
      } else {
        this.alertService.error(this.t('user_management.error'), response.message || this.t('user_management.failed_load_roles'));
      }
      this.loadingRoles = false;
    }).catch(err => {
      console.error('Error loading user roles:', err);
      this.alertService.error(this.t('user_management.error'), this.t('user_management.failed_load_roles'));
      this.loadingRoles = false;
    });
  }

  // Cuando se marca/desmarca un rol
  toggleRole(roleId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.userRoles = this.userRoles.map(r =>
      r.role_id === roleId ? { ...r, has_role: checked } : r
    );
  }

   
}
