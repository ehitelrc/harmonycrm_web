
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';
import { FunnelService } from '@app/services/funnel.service';
import { Funnel } from '@app/models/funnel.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-funnel-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funnel-list.component.html',
  styleUrls: ['./funnel-list.component.css'],
})
export class FunnelListComponent {
  /** Datos */
  @Input() funnels: Funnel[] = [];
  @Input() isLoading = false;

  /** Eventos */
  @Output() editFunnel = new EventEmitter<Funnel>();
  @Output() deleteFunnelEvent = new EventEmitter<number>();
  @Output() manageStagesEvent = new EventEmitter<Funnel>();

  /** Filtros */
  searchTerm = '';                 // busca en id, name y descripción
  idFilter: number | null = null;  // filtro puntual por id
  nameFilter = '';                 // filtro puntual por name
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  /** Ordenamiento */
  sortBy: 'id' | 'name' | 'is_active' | 'stages_count' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  /** Paginación incremental (infinite scroll) */
  itemsPerPage = 25;
  visibleCount = this.itemsPerPage;
  isLoadingMore = false;

  /** Modales */
  viewingFunnel: Funnel | null = null;

  /** Borrado */
  isDeleting = false;
  deletingFunnelId: number | null = null;

  constructor(
    private languageService: LanguageService,
    private alertService: AlertService,
    private funnelService: FunnelService,
    private router: Router
  ) {}

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  /** Alternar filtros avanzados (si agregas el panel en tu HTML) */
  filtersExpanded = false;
  toggleFilters(): void { this.filtersExpanded = !this.filtersExpanded; }

  /** ¿Hay filtros activos? */
  hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim() !== '' ||
      this.idFilter !== null ||
      this.nameFilter.trim() !== '' ||
      this.activeFilter !== 'all'
    );
  }

  /** Limpiar filtros */
  clearFilters(): void {
    this.searchTerm = '';
    this.idFilter = null;
    this.nameFilter = '';
    this.activeFilter = 'all';
    this.resetVisible();
  }

  /** Cambio en búsqueda global */
  onSearch(term: string): void {
    this.searchTerm = term;
    this.resetVisible();
  }

  /** Cambio de filtros individuales */
  onFilterChange(): void {
    this.resetVisible();
  }

  /** Cambio de ordenamiento */
  onSort(field: 'id' | 'name' | 'is_active' | 'stages_count'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.resetVisible();
  }

  /** Cambiar tamaño del batch (infinite scroll) */
  changeItemsPerPage(items: number): void {
    this.itemsPerPage = items;
    this.resetVisible();
  }

  /** Lista filtrada + ordenada */
  get filteredFunnels(): Funnel[] {
    let filtered = this.funnels.filter((f) => {
    
      // Filtro por búsqueda global
      const matchesSearch =
        !this.searchTerm ||
        String(f.id).includes(this.searchTerm) ||
        (f.name && f.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (f.description && f.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Filtro por id
      const matchesId = this.idFilter === null || Number(f.id) === Number(this.idFilter);

      // Filtro por name
      const matchesName =
        !this.nameFilter ||
        (f.name && f.name.toLowerCase().includes(this.nameFilter.toLowerCase()));

      // Filtro por activo/inactivo
      const matchesActive =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'active' && !!f.is_active) ||
        (this.activeFilter === 'inactive' && !f.is_active);

      return matchesSearch && matchesId && matchesName && matchesActive;
    });

    // Orden
    filtered.sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (this.sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'is_active':
          aValue = !!a.is_active;
          bValue = !!b.is_active;
          break;
       
        default: // 'name'
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  /** Ventana visible (para infinite scroll) */
  get visibleFunnels(): Funnel[] {
    return this.filteredFunnels.slice(0, this.visibleCount);
  }

  /** ¿Todo cargado? */
  get allLoaded(): boolean {
    return this.visibleCount >= this.filteredFunnels.length;
  }

  /** Scroll del contenedor de la tabla/lista (para cargar más) */
  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const thresholdPx = 200;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - thresholdPx;
    if (reachedBottom) this.loadMore();
  }

  /** Cargar más (batch) */
  private loadMore(): void {
    if (this.isLoadingMore || this.allLoaded) return;
    this.isLoadingMore = true;
    setTimeout(() => {
      const remaining = this.filteredFunnels.length - this.visibleCount;
      const toAdd = Math.min(this.itemsPerPage, remaining);
      this.visibleCount += toAdd;
      this.isLoadingMore = false;
    }, 0);
  }

  /** Reset de ventana visible */
  private resetVisible(): void {
    this.visibleCount = this.itemsPerPage;
  }

  /** Editar */
  onEdit(f: Funnel): void {
    this.editFunnel.emit(f);
  }

  /** Gestionar etapas */
  manageStages(f: Funnel): void {
    //this.manageStagesEvent.emit(f);
     this.router.navigate(['/funnels', f.id, 'stages']);
  }

  /** Preparar borrado */
  confirmDelete(funnelId: number): void {
    this.deletingFunnelId = funnelId;
  }

  /** Cancelar borrado */
  cancelDelete(): void {
    this.deletingFunnelId = null;
  }

  /** Borrar */
  async deleteFunnel(): Promise<void> {
    if (!this.deletingFunnelId) return;
    try {
      this.isDeleting = true;
      const resp = await this.funnelService.delete(this.deletingFunnelId);
      if (resp?.success) {
        this.alertService.success(this.t('funnel_deleted_successfully') || 'Funnel eliminado');
        this.deleteFunnelEvent.emit(this.deletingFunnelId);
        this.deletingFunnelId = null;
      } else {
        this.alertService.error(this.t('failed_to_delete_funnel') || 'No se pudo eliminar el funnel');
      }
    } catch (err) {
      console.error(err);
      this.alertService.error(this.t('failed_to_delete_funnel') || 'No se pudo eliminar el funnel');
    } finally {
      this.isDeleting = false;
    }
  }

  /** Cerrar modales al hacer click en backdrop */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.viewingFunnel = null;
      this.deletingFunnelId = null;
    }
  }
}