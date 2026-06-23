import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tag } from '../../../../models/tag';
import { Department } from '../../../../models/department.model';
import { LanguageService } from '@app/services';
import { TagIconComponent } from '../tag-icon/tag-icon.component';

@Component({
  selector: 'app-tags-list',
  standalone: true,
  imports: [CommonModule, TagIconComponent],
  template: `
    <div class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div class="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-[#f8f9fa] dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tag
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                
                <tr *ngIf="isLoading">
                  <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
                
                <tr *ngIf="!isLoading && tags.length === 0">
                  <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    No hay tags configurados.
                  </td>
                </tr>

                <tr *ngFor="let tag of tags" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    #{{ tag.id }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm" [ngStyle]="{'background-color': tag.color}">
                      <app-tag-icon [name]="tag.icon" [classes]="'h-4 w-4 mr-2'"></app-tag-icon> {{ tag.name }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {{ getDepartmentName(tag.department_id) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="edit.emit(tag)" class="text-[#3e66ea] hover:text-[#00113f] mr-4">
                      Editar
                    </button>
                    <button (click)="remove.emit(tag)" class="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TagsListComponent {
  @Input() tags: Tag[] = [];
  @Input() departments: Department[] = [];
  @Input() isLoading = false;
  @Output() edit = new EventEmitter<Tag>();
  @Output() remove = new EventEmitter<Tag>();

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  getDepartmentName(deptId?: number): string {
    if (!deptId) return 'Global / Todos';
    const dept = this.departments.find(d => d.id === deptId);
    return dept ? dept.name : `Dep #${deptId}`;
  }
}
