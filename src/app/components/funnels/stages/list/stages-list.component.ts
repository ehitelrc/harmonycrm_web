import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';
import { FunnelService } from '@app/services/funnel.service';
import { FunnelStage } from '@app/models/funnel.model';

@Component({
  selector: 'app-stages-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stages-list.component.html',
  styleUrls: ['./stages-list.component.css'],
})
export class StagesListComponent {
  /** Datos */
  @Input() stages: FunnelStage[] = [];
  @Input() isLoading = false;

  /** Eventos */
  @Output() editStage = new EventEmitter<FunnelStage>();
  @Output() deleteStageEvent = new EventEmitter<number>();

  /** Filtros */
  searchTerm = '';                 // busca en id y name
  idFilter: number | null = null;  // filtro puntual por id
  nameFilter = '';                 // filtro puntual por name
  outcomeFilter: 'all' | 'won' | 'lost' | 'neutral' = 'all';

  /** Ordenamiento */
  sortBy: 'position' | 'name' | 'id' | 'is_won' | 'is_lost' = 'position';
  sortOrder: 'asc' | 'desc' = 'asc';

  /** Paginación incremental (infinite scroll) */
  itemsPerPage = 50;
  visibleCount = this.itemsPerPage;
  isLoadingMore = false;

  /** UI */
  isDeleting = false;
  deletingStageId: number | null = null;

  constructor(
    private languageService: LanguageService,
    private alertService: AlertService,
    private funnelService: FunnelService
  ) {}

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  /** Cambio en búsqueda global */
  onSearch(term: string): void {
    this.searchTerm = term || '';
    this.resetVisible();
  }

  /** Cambio de filtros individuales */
  onFilterChange(): void {
    this.resetVisible();
  }

  /** Cambio de ordenamiento */
  onSort(field: 'position' | 'name' | 'id' | 'is_won' | 'is_lost'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.resetVisible();
  }

  /** Lista filtrada + ordenada */
  get filteredStages(): FunnelStage[] {
    let filtered = this.stages.filter((s) => {
      const matchesSearch =
        !this.searchTerm ||
        String(s.id ?? '').includes(this.searchTerm) ||
        (s.name && s.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesId =
        this.idFilter === null || Number(s.id) === Number(this.idFilter);

      const matchesName =
        !this.nameFilter ||
        (s.name && s.name.toLowerCase().includes(this.nameFilter.toLowerCase()));

      const matchesOutcome =
        this.outcomeFilter === 'all' ||
        (this.outcomeFilter === 'won' && !!s.is_won) ||
        (this.outcomeFilter === 'lost' && !!s.is_lost) ||
        (this.outcomeFilter === 'neutral' && !s.is_won && !s.is_lost);

      return matchesSearch && matchesId && matchesName && matchesOutcome;
    });

    // Orden
    filtered.sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (this.sortBy) {
        case 'id':
          aValue = a.id ?? 0; bValue = b.id ?? 0; break;
        case 'name':
          aValue = (a.name || '').toLowerCase(); bValue = (b.name || '').toLowerCase(); break;
        case 'is_won':
          aValue = !!a.is_won; bValue = !!b.is_won; break;
        case 'is_lost':
          aValue = !!a.is_lost; bValue = !!b.is_lost; break;
        default: // position
          aValue = a.position ?? 0; bValue = b.position ?? 0; break;
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  /** Ventana visible (para infinite scroll) */
  get visibleStages(): FunnelStage[] {
    return this.filteredStages.slice(0, this.visibleCount);
  }

  /** Scroll (cargar más) */
  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const thresholdPx = 200;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - thresholdPx) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    if (this.isLoadingMore || this.visibleCount >= this.filteredStages.length) return;
    this.isLoadingMore = true;
    setTimeout(() => {
      const remaining = this.filteredStages.length - this.visibleCount;
      const toAdd = Math.min(this.itemsPerPage, remaining);
      this.visibleCount += toAdd;
      this.isLoadingMore = false;
    }, 0);
  }

  private resetVisible(): void {
    this.visibleCount = this.itemsPerPage;
  }

  /** Editar */
  onEdit(stage: FunnelStage): void {
    this.editStage.emit(stage);
  }

  /** Borrado */
  confirmDelete(stageId: number): void {
    this.deletingStageId = stageId;
  }
  cancelDelete(): void {
    this.deletingStageId = null;
  }

  async deleteStage(): Promise<void> {
    if (!this.deletingStageId) return;
    try {
      this.isDeleting = true;
      const resp = await this.funnelService.deleteStage(this.deletingStageId);
      if (resp?.success) {
        this.alertService.success(this.t('funnel.stage_deleted_successfully') || 'Etapa eliminada');
        this.deleteStageEvent.emit(this.deletingStageId);
        this.deletingStageId = null;
      } else {
        this.alertService.error(this.t('funnel.failed_to_delete_stage') || 'No se pudo eliminar la etapa');
      }
    } catch (err) {
      console.error(err);
      this.alertService.error(this.t('funnel.failed_to_delete_stage') || 'No se pudo eliminar la etapa');
    } finally {
      this.isDeleting = false;
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.deletingStageId = null;
    }
  }
}