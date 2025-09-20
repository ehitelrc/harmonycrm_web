import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Role } from '@app/models/role.model';
import { RolePermissionView } from '@app/models/role_permissions_view.model';
import { RoleService } from '@app/services/role.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';

@Component({
  selector: 'app-permissions-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './permissions-roles-management.component.html',
  styleUrls: ['./permissions-roles-management.component.css'],
})
export class PermissionsRoleManagementComponent implements OnInit {
  roles: Role[] = [];
  permissions: RolePermissionView[] = [];
  selectedRoleId: number | null = null;
  isLoading = false;

  constructor(
    private roleService: RoleService,
    private languageService: LanguageService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  async loadRoles(): Promise<void> {
    try {
      const response = await this.roleService.getAll();
      if (response.success && response.data) {
        this.roles = response.data;
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      this.alertService.error(this.t('error'), this.t('failed_load_roles'));
    }
  }

  async onRoleChange(): Promise<void> {
    if (!this.selectedRoleId) return;
    try {
      const response = await this.roleService.getPermissionsByRoleId(this.selectedRoleId);
      if (response.success && response.data) {
        this.permissions = response.data;
      } else {
        this.permissions = [];
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      this.alertService.error(this.t('error'), this.t('failed_load_permissions'));
    }
  }

  async savePermissions(): Promise<void> {
    if (!this.selectedRoleId) return;

    try {
      const payload = this.permissions
        .map(p => ({
          role_id: this.selectedRoleId!, // <- "!" indica que no es null aquí
          permission_id: p.permission_id,
          assign_request: p.assigned
        }));

      // Llamar al endpoint de "ReplaceForRole"
      await this.roleService.updateRolePermissions(payload);

      this.alertService.success(this.t('success'), this.t('permissions_saved'));
    } catch (err) {
      console.error('Error saving permissions:', err);
      this.alertService.error(this.t('error'), this.t('failed_save_permissions'));
    }
  }

  selectAll(): void {
    this.permissions = this.permissions.map(p => ({ ...p, assigned: true }));
  }

  deselectAll(): void {
    this.permissions = this.permissions.map(p => ({ ...p, assigned: false }));
  }

  invertSelection(): void {
    this.permissions = this.permissions.map(p => ({ ...p, assigned: !p.assigned }));
  }
}