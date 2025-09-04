import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompaniesListComponent {
  /** Datos */
  @Input() companies: Company[] = [];
  @Input() isLoading = false;
  @Output() openDepartments = new EventEmitter<number>();

  /** Eventos */
  @Output() editCompany = new EventEmitter<Company>();
  @Output() deleteCompany = new EventEmitter<number>(); // emitimos el id borrado

  /** Filtros */
  searchTerm = '';          // busca en id y name
  idFilter: number | null = null;   // opcional, si deseas campo solo para id
  nameFilter = '';          // opcional, si deseas campo solo para name

  /** Ordenamiento */
  sortBy: 'id' | 'name' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  /** UI */
  filtersExpanded = false;

  /** Paginación incremental (infinite scroll) */
  itemsPerPage = 25;
  visibleCount = this.itemsPerPage;
  isLoadingMore = false;

  viewingCompany: Company | null = null;

  /** Borrado */
  isDeleting = false;
  deletingCompanyId: number | null = null;

  constructor(
    private languageService: LanguageService,
    private alertService: AlertService,
    private companyService: CompanyService,
  ) { }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  /** Alternar panel de filtros */
  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  /** ¿Hay filtros activos? */
  hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim() !== '' ||
      this.idFilter !== null ||
      this.nameFilter.trim() !== ''
    );
  }

  /** Limpiar filtros */
  clearFilters(): void {
    this.searchTerm = '';
    this.idFilter = null;
    this.nameFilter = '';
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
  onSort(field: 'id' | 'name'): void {
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
  get filteredCompanies(): Company[] {
    let filtered = this.companies.filter((c) => {
      // Filtro por searchTerm (id o name)
      const matchesSearch =
        !this.searchTerm ||
        String(c.id).includes(this.searchTerm) ||
        (c.name && c.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Filtro por id puntual
      const matchesId =
        this.idFilter === null || Number(c.id) === Number(this.idFilter);

      // Filtro por name puntual
      const matchesName =
        !this.nameFilter ||
        (c.name && c.name.toLowerCase().includes(this.nameFilter.toLowerCase()));

      return matchesSearch && matchesId && matchesName;
    });

    // Orden
    filtered.sort((a, b) => {
      let aValue: string | number = this.sortBy === 'id' ? a.id : (a.name || '');
      let bValue: string | number = this.sortBy === 'id' ? b.id : (b.name || '');

      if (this.sortBy === 'name') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  /** Ventana visible (para infinite scroll) */
  get visibleCompanies(): Company[] {
    return this.filteredCompanies.slice(0, this.visibleCount);
  }

  /** ¿Todo cargado? */
  get allLoaded(): boolean {
    return this.visibleCount >= this.filteredCompanies.length;
  }

  /** Scroll del contenedor de la tabla/lista (para cargar más) */
  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const thresholdPx = 200;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - thresholdPx;
    if (reachedBottom) {
      this.loadMore();
    }
  }

  /** Cargar más (batch) */
  private loadMore(): void {
    if (this.isLoadingMore || this.allLoaded) return;
    this.isLoadingMore = true;
    setTimeout(() => {
      const remaining = this.filteredCompanies.length - this.visibleCount;
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
  onEdit(company: Company): void {
    this.editCompany.emit(company);
  }

  /** Preparar borrado */
  confirmDelete(companyId: number): void {
    this.deletingCompanyId = companyId;
  }

  /** Cancelar borrado */
  cancelDelete(): void {
    this.deletingCompanyId = null;
  }

  /** Borrar */
  async deleteCompanyItem(): Promise<void> {
    if (!this.deletingCompanyId) return;
    try {
      this.isDeleting = true;
      const resp = await this.companyService.deleteCompany(this.deletingCompanyId);
      if (resp?.success) {
        this.alertService.success(this.t('company_deleted_successfully') || 'Compañía eliminada');
        this.deleteCompany.emit(this.deletingCompanyId);
        this.deletingCompanyId = null;
      } else {
        this.alertService.error(this.t('failed_to_delete_company') || 'No se pudo eliminar la compañía');
      }
    } catch (err) {
      console.error(err);
      this.alertService.error(this.t('failed_to_delete_company') || 'No se pudo eliminar la compañía');
    } finally {
      this.isDeleting = false;
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {

    }
  }

  goDepartments(c: Company): void {
    if (!c?.id) return;
    this.openDepartments.emit(c.id);
  }

}