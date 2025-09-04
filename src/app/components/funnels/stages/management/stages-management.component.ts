import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { Funnel } from '@app/models/funnel.model';
import { FunnelService } from '@app/services/funnel.service';
import { StageFormComponent } from '../form/stages-form.component';
import { StagesListComponent } from '../list/stages-list.component';
 
 

@Component({
  selector: 'app-stages-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent,
    StageFormComponent,
    StagesListComponent
  ],
  templateUrl: './stages-management.component.html',
  styleUrls: ['./stages-management.component.css'],
})
export class StagesManagementComponent {
  funnelId!: number;
  funnel: Funnel | null = null;

  stages: any[] = [];         // tu interfaz Stage si la tienes definida
  isLoading = false;

  isCreateDialogOpen = false;
  selectedStage: any | null = null;

  constructor(
    private route: ActivatedRoute,
    private funnelService: FunnelService,
    private authService: AuthorizationService,
    private languageService: LanguageService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Lee :id de la URL
    this.funnelId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.funnelId) {
      this.alertService.error('Funnel ID inválido');
      return;
    }
    this.loadFunnel();
    this.loadStages();
  }

  /** i18n helper */
  t(key: string): string {
    return this.languageService.translate(key);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /** Cargar info del funnel para título/breadcrumbs */
  async loadFunnel(): Promise<void> {
    try {
      const res = await this.funnelService.getById(this.funnelId);
      if (res?.success) {
        this.funnel = res.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  /** Cargar stages del funnel */
  async loadStages(): Promise<void> {
    try {
      this.isLoading = true;
      const res = await this.funnelService.getStages(this.funnelId); // GET /funnels/:id/stages
      if (res?.success && Array.isArray(res.data)) {
        // Ordena por position si lo quieres consistente
        this.stages = [...res.data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      } else {
        this.alertService.error(this.t('funnel.failed_to_load_stages'));
      }
    } catch (err) {
      console.error('Error loading stages:', err);
      this.alertService.error(this.t('funnel.failed_to_load_stages'));
    } finally {
      this.isLoading = false;
    }
  }

  /** Abrir modal crear */
  openCreateDialog(): void {
    this.selectedStage = null;
    this.isCreateDialogOpen = true;
  }

  /** Cerrar modal */
  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
    this.selectedStage = null;
  }

  /** Editar */
  openEditDialog(stage: any): void {
    this.selectedStage = stage;
    this.isCreateDialogOpen = true;
  }

  /** Éxito al crear/editar */
  onStageSuccess(): void {
    const wasEditing = !!this.selectedStage;
    this.closeCreateDialog();
    this.loadStages();
    this.alertService.success(
      wasEditing ? this.t('funnel.stage_updated_successfully') : this.t('funnel.stage_created_successfully')
    );
  }

  /** Éxito al borrar desde la lista */
  onStageDeleted(): void {
    this.loadStages();
    this.alertService.success(this.t('funnel.stage_deleted_successfully'));
  }
}