import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Confirmar Cierre Masivo</h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Estás a punto de cerrar {{ caseCount }} casos. Esta acción no se puede deshacer. Por favor ingresa tu contraseña para continuar.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="password"
              placeholder="••••••••"
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3">
          <button 
            type="button" 
            (click)="onCancel()"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            (click)="onConfirm()"
            [disabled]="!password"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar Cierre
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class PasswordConfirmDialogComponent {
  @Input() caseCount: number = 0;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  password = '';

  onConfirm() {
    if (this.password) {
      this.confirm.emit(this.password);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
