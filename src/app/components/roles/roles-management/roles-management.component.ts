import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
 
import { AuthorizationService } from '../../../services/extras/authorization.service';
import { AlertService } from '../../../services/extras/alert.service';
import { LanguageService } from '../../../services/extras/language.service';
import { UserService } from '../../../services/user.service';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { DataExportComponent, DataExportConfig } from '../../shared/data-export/data-export.component';
import { FileImportComponent, FileImportConfig, ImportResult } from '../../shared/file-import/file-import.component';
import { RolesListComponent } from '../roles-list/roles-list.component';
import { RolesFormComponent } from '../roles-form/roles-form.component';
import { Role } from '@app/models/role.model';
import { RoleService } from '@app/services/role.service';

@Component({
  selector: 'app-roles-management',
  standalone: true,
  imports: [
    CommonModule,
    RolesListComponent,
    RolesFormComponent,
    FileImportComponent,
    DataExportComponent,
    MainLayoutComponent
  ],
  templateUrl: './roles-management.component.html',
  styleUrls: ['./roles-management.component.css']
})
export class RolesManagementComponent implements OnInit {
  roles: Role[] = [];
  isLoading = false;
  isCreateDialogOpen = false;
  isImportDialogOpen = false;
  isExportDialogOpen = false;
  selectedRoles: Role | null = null;

  // Export configuration
  exportConfig: DataExportConfig = {
    title: 'Export Users',
    endpoint: '/api/users/export',
    data: [],
    filename: 'users_export'
  };

  // Import configuration
  importConfig: FileImportConfig = {
    title: 'import_users',
    endpoint: '/api/users/import',
    acceptedFormats: ['.csv', '.xlsx', '.xls'],
    templateFields: ['id_usuario', 'email', 'nombre', 'apellido', 'contraseña', 'rol'],
    maxFileSize: 10,
    templateType: 'users'
  };

  constructor(
    private roleService: RoleService,
    private languageService: LanguageService,
    private alertService: AlertService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  async loadUsers(): Promise<void> {
    this.isLoading = true;

    try {
      const response = await this.roleService.getAll();

      if (response.success && response.data) {
        this.roles = Array.isArray(response.data) ? response.data : [];
        // Update export data
        this.exportConfig = {
          ...this.exportConfig,
          data: this.roles
        };
      } else {
        this.roles = [];
        this.alertService.error(
          this.t('roles_management.error'),
          response.message || this.t('roles_management.failed_load_users')
        );
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.roles = [];
      this.alertService.error(
        this.t('roles_management.error'),
        error.message || this.t('roles_management.failed_load_users')
      );
    } finally {
      this.isLoading = false;
    }
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
  }

  openImportDialog(): void {
    this.isImportDialogOpen = true;
  }

  closeImportDialog(): void {
    this.isImportDialogOpen = false;
  }

  openExportDialog(): void {
    this.exportConfig.data = this.roles;
    this.isExportDialogOpen = true;
  }

  closeExportDialog(): void {
    this.isExportDialogOpen = false;
  }

  onExportSuccess(): void {
    this.closeExportDialog();
  }

  onCreateSuccess(): void {
    this.closeCreateDialog();
    this.loadUsers(); // Refresh the list
  }

  onImportSuccess(result: ImportResult): void {
    this.closeImportDialog();
    this.loadUsers(); // Refresh the list

    // Show detailed import results
    if (result.failed > 0) {
      this.alertService.warning(
        `${this.t('import_completed_with_errors')} - ${this.t('successful')}: ${result.successful}, ${this.t('failed')}: ${result.failed}`,
        this.t('import_summary')
      );
    }
  }

  onImportError(error: string): void {
    console.error('Import error:', error);
  }

  onRefresh(): void {
    this.loadUsers();
  }

  // Authorization methods
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
