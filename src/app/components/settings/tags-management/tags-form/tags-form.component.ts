import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tag } from '../../../../models/tag';
import { TagService } from '../../../../services/tag.service';
import { TagIconComponent } from '../tag-icon/tag-icon.component';

@Component({
  selector: 'app-tag-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TagIconComponent],
  template: `
    <div>
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
        {{ tag ? 'Editar Tag' : 'Nuevo Tag' }}
      </h3>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input type="text" formControlName="name" 
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-[#3e66ea] focus:border-[#3e66ea] sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <select formControlName="color" 
              class="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-[#3e66ea] focus:border-[#3e66ea] sm:text-sm dark:text-white">
              <option *ngFor="let c of colors" [value]="c.value">{{ c.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Icono</label>
            <div class="flex gap-2 items-center mt-1">
              <select formControlName="icon" 
                class="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-[#3e66ea] focus:border-[#3e66ea] sm:text-sm dark:text-white">
                <option *ngFor="let ic of icons" [value]="ic.value">
                  {{ ic.label }}
                </option>
              </select>
              <div class="p-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-600 flex-shrink-0" style="width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
                <app-tag-icon [name]="form.get('icon')?.value" [classes]="'h-6 w-6 text-gray-900 dark:text-white'"></app-tag-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
          <button type="submit" [disabled]="form.invalid || isSaving" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#00113f] text-base font-medium text-white hover:bg-[#3e66ea] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            <svg *ngIf="isSaving" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardar
          </button>
          <button type="button" (click)="cancel.emit()" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `
})
export class TagFormComponent implements OnInit {
  @Input() tag: Tag | null = null;
  @Output() success = new EventEmitter<Tag>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isSaving = false;

  colors = [
    { label: 'Rojo (#ef4444)', value: '#ef4444' },
    { label: 'Azul (#3b82f6)', value: '#3b82f6' },
    { label: 'Verde (#10b981)', value: '#10b981' },
    { label: 'Amarillo (#f59e0b)', value: '#f59e0b' },
    { label: 'Morado (#8b5cf6)', value: '#8b5cf6' },
    { label: 'Gris (#6b7280)', value: '#6b7280' },
    { label: 'Naranja (#f97316)', value: '#f97316' },
    { label: 'Rosa (#ec4899)', value: '#ec4899' },
    { label: 'Negro (#1f2937)', value: '#1f2937' },
    { label: 'Cian (#06b6d4)', value: '#06b6d4' }
  ];

  icons = [
    { label: 'Etiqueta', value: 'Tag' },
    { label: 'Estrella', value: 'Star' },
    { label: 'Alerta / Peligro', value: 'Alert' },
    { label: 'Información', value: 'Info' },
    { label: 'Check / Éxito', value: 'Check' },
    { label: 'Reloj / Tiempo', value: 'Clock' },
    { label: 'Corazón / Favorito', value: 'Heart' },
    { label: 'Usuario', value: 'User' },
    { label: 'Teléfono / Llamada', value: 'Phone' },
    { label: 'Mensaje / Chat', value: 'Message' },
    { label: 'Dinero / Venta', value: 'Dollar' },
    { label: 'Maletín / Trabajo', value: 'Briefcase' },
    { label: 'Carpeta / Directorio', value: 'Folder' },
    { label: 'Documento / Archivo', value: 'Document' },
    { label: 'Carrito de Compras', value: 'Cart' },
    { label: 'Calendario', value: 'Calendar' },
    { label: 'Engranaje / Ajustes', value: 'Settings' },
    { label: 'Lupa / Búsqueda', value: 'Search' },
    { label: 'Rayo / Rápido', value: 'Bolt' },
    { label: 'Escudo / Protección', value: 'Shield' },
    { label: 'Candado / Seguro', value: 'Lock' },
    { label: 'Llave / Acceso', value: 'Key' },
    { label: 'Cámara', value: 'Camera' },
    { label: 'Nube', value: 'Cloud' },
    { label: 'Ubicación / Pin', value: 'Location' },
    { label: 'Bandera / Meta', value: 'Flag' },
    { label: 'Camión / Envío', value: 'Truck' },
    { label: 'Libro / Conocimiento', value: 'Book' },
    { label: 'Casa / Inicio', value: 'Home' }
  ];

  constructor(private fb: FormBuilder, private service: TagService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      color: ['#3b82f6', Validators.required],
      icon: ['Tag', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.tag) {
      this.form.patchValue(this.tag);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving = true;

    const data = this.form.value;

    if (this.tag?.id) {
      this.service.updateTag(this.tag.id, data).subscribe({
        next: (savedTag) => {
          this.isSaving = false;
          this.success.emit(savedTag);
        },
        error: () => this.isSaving = false
      });
    } else {
      this.service.createTag(data).subscribe({
        next: (savedTag) => {
          this.isSaving = false;
          this.success.emit(savedTag);
        },
        error: () => this.isSaving = false
      });
    }
  }
}
