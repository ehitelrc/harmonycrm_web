import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { CaseService } from '@app/services/case.service';
import { CompanyService } from '@app/services/company.service';
import { DepartmentService } from '@app/services/department.service';
import { AuthService } from '@app/services/auth.service';
import { AlertService } from '@app/services/extras/alert.service';
import { User } from '@app/models/auth.model';
import { Department } from '@app/models/department.model';
import { PasswordConfirmDialogComponent } from './password-confirm-dialog/password-confirm-dialog';

@Component({
  selector: 'app-cases-bulk-close',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, PasswordConfirmDialogComponent],
  templateUrl: './cases-bulk-close.html',
  styleUrl: './cases-bulk-close.css'
})
export class CasesBulkClose implements OnInit {
  user: User | null = null;
  companies: any[] = [];
  departments: Department[] = [];

  selectedCompanyId: number | null = null;
  selectedDepartmentId: number | null = null;
  startDate: string = '';
  endDate: string = '';

  loading = false;
  results: any[] = [];
  selectedCaseIds: Set<number> = new Set<number>();

  showPasswordDialog = false;

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseService: CaseService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;

    // Set default dates
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const twoMonthsAgo = new Date(oneMonthAgo);
    twoMonthsAgo.setMonth(oneMonthAgo.getMonth() - 1);

    this.endDate = oneMonthAgo.toISOString().split('T')[0];
    this.startDate = twoMonthsAgo.toISOString().split('T')[0];

    await this.loadCompanies();
  }

  async loadCompanies() {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data?.length) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0].company_id;
        await this.loadDepartments();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async loadDepartments() {
    if (!this.selectedCompanyId) return;
    try {
      const res = await this.departmentService.getByCompanyAndUser(
        this.selectedCompanyId,
        this.user!.user_id
      );
      this.departments = res.success && res.data ? res.data : [];
      if (this.departments.length > 0) {
        this.selectedDepartmentId = this.departments[0].id;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async onCompanyChange() {
    this.selectedDepartmentId = null;
    await this.loadDepartments();
  }

  async searchCases() {
    if (!this.selectedCompanyId || !this.selectedDepartmentId || !this.startDate || !this.endDate) {
      this.alertService.error('Faltan filtros requeridos');
      return;
    }

    this.loading = true;
    this.results = [];
    this.selectedCaseIds.clear();
    this.cdr.detectChanges();

    try {
      // Formato RFC3339 para Go backend
      const startIso = new Date(this.startDate).toISOString();
      const endIso = new Date(this.endDate + 'T23:59:59').toISOString();

      const res = await this.caseService.searchBulkCloseCases(
        this.selectedCompanyId,
        this.selectedDepartmentId,
        startIso,
        endIso
      );

      if (res.success && res.data) {
        this.results = res.data;
      }
    } catch (err) {
      this.alertService.error('Error al buscar casos');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  toggleSelection(caseId: number) {
    if (this.selectedCaseIds.has(caseId)) {
      this.selectedCaseIds.delete(caseId);
    } else {
      this.selectedCaseIds.add(caseId);
    }
  }

  selectAll() {
    this.results.forEach(c => this.selectedCaseIds.add(c.case_id));
  }

  deselectAll() {
    this.selectedCaseIds.clear();
  }

  invertSelection() {
    const newSelection = new Set<number>();
    this.results.forEach(c => {
      if (!this.selectedCaseIds.has(c.case_id)) {
        newSelection.add(c.case_id);
      }
    });
    this.selectedCaseIds = newSelection;
  }

  confirmClose() {
    if (this.selectedCaseIds.size === 0) {
      this.alertService.error('Debe seleccionar al menos un caso');
      return;
    }
    this.showPasswordDialog = true;
  }

  async executeClose(password: string) {
    if (!this.user) return;
    this.loading = true;
    try {
      const res = await this.caseService.executeBulkClose(
        Array.from(this.selectedCaseIds),
        password,
        this.user.user_id
      );

      if (res.success) {
        this.alertService.success('Casos cerrados correctamente');
        this.showPasswordDialog = false;
        
        // Remove closed cases from view
        this.results = this.results.filter(c => !this.selectedCaseIds.has(c.case_id));
        this.selectedCaseIds.clear();

        if (this.results.length === 0) {
          if (confirm('Se han cerrado todos los casos en esta vista. ¿Deseas buscar más casos en este rango?')) {
            this.searchCases();
          }
        }
      } else {
        this.alertService.error('Error: Contraseña incorrecta o problema en el servidor');
      }
    } catch (err) {
      this.alertService.error('Error al cerrar casos');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
