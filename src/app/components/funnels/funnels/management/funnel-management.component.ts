import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { DataExportConfig } from '@app/components/shared/data-export/data-export.component';
import { FileImportConfig, ImportResult } from '@app/components/shared/file-import/file-import.component';
import { LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';
import { AuthorizationService } from '@app/services/extras/authorization.service';
 
import { Funnel } from '@app/models/funnel.model';
import { FunnelService } from '@app/services/funnel.service';
import { FunnelListComponent } from '../list/funnel-list.component';
import { FunnelFormComponent } from '../form/funnel-form.component';

@Component({
  selector: 'app-funnel-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    FunnelListComponent,
    FunnelFormComponent
 
  ],
  templateUrl: './funnel-management.component.html',
  styleUrls: ['./funnel-management.component.css'],
})
export class FunnelManagementComponent {
  funnels: Funnel[] = [];
  isLoading = false;

  isCreateDialogOpen = false;
  selectedFunnel: Funnel | null = null;

  isImportDialogOpen = false;
  isExportDialogOpen = false;

  // Export configuration
  exportConfig: DataExportConfig = {
    title: 'Export funnels',
    endpoint: '/api/funnels/export',
    data: [],
    filename: 'funnels_export',
  };

  // Import configuration (optional — adjust to your backend)
  importConfig: FileImportConfig = {
    title: 'import_funnels',
    endpoint: '/api/funnels/import',
    acceptedFormats: ['.csv', '.xlsx', '.xls'],
    templateFields: ['name', 'description', 'is_active', 'stages[name,position,is_won,is_lost,sla_hours]'],
    maxFileSize: 10,
    templateType: 'funnels',
  };

  constructor(
    private authService: AuthorizationService,
    private alertService: AlertService,
    private languageService: LanguageService,
    private funnelService: FunnelService
  ) {}

  ngOnInit(): void {
    this.loadFunnels();
  }

  /** i18n helper */
  t(key: string): string {
    return this.languageService.translate(key);
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /** Load all funnels */
  async loadFunnels(): Promise<void> {
    try {
      this.isLoading = true;
      const res = await this.funnelService.getAll();

      if (res?.success && Array.isArray(res.data)) {
        this.funnels = res.data;
        this.exportConfig.data = this.funnels;
      } else {
        this.alertService.error(this.t('funnel.failed_to_load_funnels'));
      }
    } catch (err) {
      console.error('Error loading funnels:', err);
      this.alertService.error(this.t('funnel.failed_to_load_funnels'));
    } finally {
      this.isLoading = false;
    }
  }

  /** Open create dialog */
  openCreateDialog(): void {
    this.selectedFunnel = null;
    this.isCreateDialogOpen = true;
  }

  /** Close create/edit dialog */
  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
    this.selectedFunnel = null;
  }

  /** Open edit dialog */
  openEditDialog(funnel: Funnel): void {
    this.selectedFunnel = funnel;
    this.isCreateDialogOpen = true;
  }

  /** After create/update success */
  onFunnelSuccess(): void {
    const wasEditing = !!this.selectedFunnel;
    this.closeCreateDialog();
    this.loadFunnels();
    this.alertService.success(
      wasEditing ? this.t('funnel.updated_successfully') : this.t('funnel.created_successfully')
    );
  }

  /** After delete in list */
  onFunnelDeleted(): void {
    this.loadFunnels();
    this.alertService.success(this.t('funnel.deleted_successfully'));
  }

  // --- Import / Export (optional wiring) ---

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
    this.alertService.success(this.t('import_successful'));
    this.closeImportDialog();
    this.loadFunnels();
  }

  onImportError(error: string): void {
    this.alertService.error(error || this.t('failed_to_import'));
  }

  onExportSuccess(): void {
    this.alertService.success(this.t('export_successful'));
    this.closeExportDialog();
  }
}