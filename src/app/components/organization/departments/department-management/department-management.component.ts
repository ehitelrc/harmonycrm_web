import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services/extras/language.service';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { Department, Departments } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';

import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { DepartmentsListComponent } from '../department-list/department-list.component';
import { DepartmentFormComponent } from '../department-form/department-form.component';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MainLayoutComponent,
    DepartmentsListComponent,
    DepartmentFormComponent
  ],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.css']
})
export class DepartmentManagementComponent {
  @Input() companyId?: number;

  company: Company | null = null;
  departments: Departments = [];
  isLoading = false;

  isFormOpen = false;
  selectedDepartment: Department | null = null;

  constructor(
    private route: ActivatedRoute,
    private lang: LanguageService,
    private auth: AuthorizationService,
    private alert: AlertService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Toma companyId por @Input o por ruta
    if (!this.companyId) {
      const idParam = this.route.snapshot.paramMap.get('companyId');
      this.companyId = idParam ? Number(idParam) : undefined;
    }
    if (!this.companyId) {
      console.error('companyId es requerido para DepartmentManagementComponent');
      return;
    }
    this.loadCompanyAndDepartments(this.companyId);
  }

  get t() {
    return this.lang.t.bind(this.lang);
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  private async loadCompanyAndDepartments(companyId: number) {
    try {
      this.isLoading = true;
      // Cargar compañía (solo para mostrar nombre en encabezado)
      const c = await this.companyService.getCompanyById(companyId);
      if (c.success && c.data) {
        this.company = c.data as unknown as Company;
      }

      const resp = await this.departmentService.getByCompany(companyId);
      if (resp.success && resp.data) {
        this.departments = resp.data;
      } else {
        this.alert.error(this.t('department.failed_to_load_departments'));
      }
    } catch (e) {
      console.error(e);
      this.alert.error(this.t('department.failed_to_load_departments'));
    } finally {
      this.isLoading = false;
    }
  }

  openCreateDialog(): void {
    this.selectedDepartment = null;
    this.isFormOpen = true;
  }

  openEditDialog(d: Department): void {
    this.selectedDepartment = d;
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.selectedDepartment = null;
  }

  async onSuccess(d: Department): Promise<void> {
    if (!this.companyId) return;
    this.closeDialog();
    await this.loadCompanyAndDepartments(this.companyId);


    console.log(d);
    

    this.alert.success(
      d.id != 0 ? this.t('department.updated_successfully') : this.t('department.created_successfully')
    );
  }

  // department-management.component.ts
  async onRemove(departmentId: number): Promise<void> {
    try {
      this.isLoading = true;
      await this.departmentService.deleteDepartment(departmentId);
      this.departments = this.departments.filter(dep => dep.id !== departmentId);

      this.alert.success(
        this.t('department.deleted_successfully')
      );

      // Opcional: mostrar notificación
      console.log(`Departamento con id ${departmentId} eliminado`);
    } catch (error) {
      this.alert.error(
        this.t('department.deleted_error')
      );
      console.error('Error al eliminar el departamento', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBackToCompanies(): void {
    this.router.navigate(['/companies']);
  }
}