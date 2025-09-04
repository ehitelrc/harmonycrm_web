import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Department } from '@app/models/department.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css']
})
export class DepartmentsListComponent {
  @Input() departments: Department[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<Department>();
  /** Emitimos el id del departamento a eliminar cuando el usuario confirma */
  @Output() remove = new EventEmitter<number>();

  // Búsqueda/orden
  searchTerm = '';
  sortBy: 'id' | 'name' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Estado del modal de confirmación
  deletingDepartmentId: number | null = null;
  isDeleting = false; // Puedes usarlo si quieres mostrar spinner mientras el padre elimina

  constructor(private languageService: LanguageService) {}

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  onSearch(term: string) {
    this.searchTerm = term || '';
  }

  onSort(field: 'id' | 'name') {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
  }

  get filtered(): Department[] {
    const q = this.searchTerm.trim().toLowerCase();

    let list = this.departments.filter(d => {
      const idMatch = q && !isNaN(Number(q)) ? String(d.id).includes(q) : false;
      const nameMatch = (d.name || '').toLowerCase().includes(q);
      return !q || idMatch || nameMatch;
    });

    list.sort((a, b) => {
      let av: any = a[this.sortBy];
      let bv: any = b[this.sortBy];
      if (this.sortBy === 'name') {
        av = String(av || '').toLowerCase();
        bv = String(bv || '').toLowerCase();
      } else {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  // Acciones UI
  editDept(d: Department) { this.edit.emit(d); }

  /** Abre el modal de confirmación */
  askRemoveDept(d: Department) {
    this.deletingDepartmentId = d.id;
  }

  /** Cierra el modal (sin borrar) */
  cancelDelete() {
    if (this.isDeleting) return; // evita cerrar mientras borra (si decides usar spinner)
    this.deletingDepartmentId = null;
  }

  /** Clic afuera del modal cierra (backdrop) */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancelDelete();
    }
  }

  /** Confirmar borrado: emite el id al padre y cierra el modal */
  confirmDelete(): void {
    if (this.deletingDepartmentId == null) return;
    // Si quieres mantener el modal abierto mientras el padre elimina:
    // this.isDeleting = true;
    this.remove.emit(this.deletingDepartmentId);
    // Cerrar de una vez (más simple para UX inmediata)
    this.deletingDepartmentId = null;
    this.isDeleting = false;
  }
}