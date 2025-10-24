import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-send-image-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    (click)="onBackdropClick($event)"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative"
      (click)="$event.stopPropagation()"
      (paste)="onPaste($event)"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
    >
      <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        📤 Enviar imagen
      </h2>

      <!-- Vista previa -->
      <div
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer text-center"
        (click)="fileInput.click()"
      >
        <ng-container *ngIf="preview; else placeholder">
          <img
            [src]="preview"
            alt="preview"
            class="max-h-48 rounded-md mb-2 object-contain"
          />
          <p class="text-sm text-gray-500">Click para reemplazar</p>
        </ng-container>

        <ng-template #placeholder>
          <p class="text-gray-500">Arrastra, pega o haz click para seleccionar una imagen</p>
        </ng-template>

        <input
          type="file"
          accept="image/*"
          #fileInput
          class="hidden"
          (change)="onFileChange($event)"
        />
      </div>

      <!-- Descripción -->
      <label class="block mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        Descripción
      </label>
      <textarea
        [(ngModel)]="description"
        rows="3"
        placeholder="Escribe una descripción..."
        class="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
      ></textarea>

      <!-- Botones -->
      <div class="mt-5 flex justify-end space-x-3">
        <button
          (click)="onCancel()"
          class="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          [disabled]="!preview"
          (click)="onSend()"
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>
    </div>
  </div>
  `,
})
export class SendImageModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() send = new EventEmitter<{ base64: string; description: string }>();

  preview: string | null = null;
  description = '';

  // === Drag & Drop ===
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  // === Clipboard ===
  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) this.readFile(file);
      }
    }
  }

  // === File Input ===
  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.preview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.onCancel();
  }

  onCancel() {
    this.close.emit();
    this.reset();
  }

  onSend() {
    if (!this.preview) return;
    this.send.emit({ base64: this.preview, description: this.description });
    this.reset();
  }

  private reset() {
    this.preview = null;
    this.description = '';
  }
}