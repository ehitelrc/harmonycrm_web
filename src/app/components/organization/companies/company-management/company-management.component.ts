import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { DataExportConfig } from '@app/components/shared/data-export/data-export.component';
import { FileImportConfig, ImportResult } from '@app/components/shared/file-import/file-import.component';
import { Inventory } from '@app/models/inventory.model';
import { InventoryService, LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { CompaniesListComponent } from '../company-list/company-list.component';
import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { CompanyFormComponent } from '../company-form/company-form.component';
import { Router } from '@angular/router';


@Component({
  selector: 'app-company-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CommonModule,
    CompaniesListComponent,
    MainLayoutComponent,
    CompanyFormComponent
  ],
  templateUrl: './company-management.component.html',
  styleUrls: ['./company-management.component.css']
})
export class CompanyManagementComponent {
  companies: Company[] = [];
  isLoading = false;
  isCreateDialogOpen = false;
  selectedCompany: Company | null = null;
  isImportDialogOpen = false;
  isExportDialogOpen = false;

  // Export configuration
  exportConfig: DataExportConfig = {
    title: 'Export companies',
    endpoint: '/api/companies/export',
    data: [],
    filename: 'companies_export'
  };

  // Import configuration
  importConfig: FileImportConfig = {
    title: 'import_companies',
    endpoint: '/api/inventory/import',
    acceptedFormats: ['.csv', '.xlsx', '.xls'],
    templateFields: ['sku', 'name', 'description', 'location', 'quantity', 'status', 'presentation', 'unit_price', 'track_by_lot', 'track_by_serial', 'track_expiration', 'min_quantity', 'max_quantity', 'image_url'],
    maxFileSize: 10,
    templateType: 'inventory'
  };


  constructor(
    private inventoryService: InventoryService,
    private authService: AuthorizationService,
    private alertService: AlertService,
    private languageService: LanguageService,
    private companyService: CompanyService,
    private router: Router,
  ) {

  }


  ngOnInit(): void {
    this.loadCompanies();
  }

  /**
   * @description Get translation for a key
   */
  t(key: string): string {
    return this.languageService.translate(key);
  }

  /**
   * @description Check if user is admin
   */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }


  async loadCompanies(): Promise<void> {
    try {
      this.isLoading = true;
      const response = await this.companyService.getAllCompanies();

      if (response.success && response.data) {
        this.companies = response.data;
        this.exportConfig.data = this.companies;
      } else {
        this.alertService.error(this.t('company.failed_to_load_companies'));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      this.alertService.error(this.t('company.failed_to_load_companies'));
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @description Load all inventory items
   */
  async loadInventory(): Promise<void> {
    //   try {
    //     this.isLoading = true;
    //     const response = await this.inventoryService.getAll();

    //     if (response.success && response.data) {
    //       this.inventory = response.data;
    //       this.exportConfig.data = this.inventory;
    //     } else {
    //       this.alertService.error(this.t('failed_to_load_inventory'));
    //     }
    //   } catch (error) {
    //     console.error('Error loading inventory:', error);
    //     this.alertService.error(this.t('failed_to_load_inventory'));
    //   } finally {
    //     this.isLoading = false;
    //   }
  }

  /**
   * @description Open create dialog
   */
  openCreateDialog(): void {
    this.selectedCompany = null;
    this.isCreateDialogOpen = true;
  }

  /**
   * @description Close create dialog
   */
  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
    this.selectedCompany = null;
  }

  /**
   * @description Open edit dialog
   */
  openEditDialog(company: Company): void {
    this.selectedCompany = company;
    this.isCreateDialogOpen = true;
  }

  /**
   * @description Handle successful company operation
   */
  onCompanySuccess(): void {
    this.closeCreateDialog();
    this.loadCompanies();
    const message = this.selectedCompany
      ? this.t('company.updated_successfully')
      : this.t('company.created_successfully');
    this.alertService.success(message);
  }

  /**
   * @description Handle inventory deletion
   */
  onInventoryDeleted(): void {
    this.loadInventory();
    this.alertService.success(this.t('inventory_deleted_successfully'));
  }

  openImportDialog(): void {
    this.isImportDialogOpen = true;
  }

  closeImportDialog(): void {
    this.isImportDialogOpen = false;
  }

  openExportDialog(): void {
    this.isExportDialogOpen = true;
  }

  closeExportDialog(): void {
    this.isExportDialogOpen = false;
  }

  onImportSuccess(result: ImportResult): void {
    this.alertService.success(
      this.t('import_successful')
    );
    this.closeImportDialog();
    this.loadInventory();
  }

  onImportError(error: string): void {
    this.alertService.error(error || this.t('failed_to_import_inventory'));
  }

  onExportSuccess(): void {
    this.alertService.success(this.t('export_successful'));
    this.closeExportDialog();
  }

  goToDepartments(companyId: number): void {
    this.router.navigate(['/departments', companyId]);
  }

}