import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-send-file-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-file-modal.component.html',
  styleUrls: ['./send-file-modal.component.css']
})
export class SendFileModalComponent {

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() send = new EventEmitter<{
    base64: string;
    filename: string;
    mime: string;
  }>();

  fileName: string | null = null;
  fileMime: string | null = null;
  filePreviewIcon = '';
  base64Content: string | null = null;

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
    const file = event.clipboardData?.files?.[0];
    if (file) this.readFile(file);
  }

  // === Input file ===
  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File) {
    this.fileName = file.name;
    this.fileMime = file.type;
    this.filePreviewIcon = this.getIcon(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.base64Content = base64
    };
    reader.readAsDataURL(file);
  }

  private getIcon(mime: string): string {
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('zip')) return '🗜️';
    if (mime.includes('word') || mime.includes('doc')) return '📘';
    if (mime.includes('excel') || mime.includes('sheet')) return '📗';
    if (mime.includes('image')) return '🖼️';
    return '📄';
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.onCancel();
  }

  onCancel() {
    this.reset();
    this.close.emit();
  }

  onSend() {
    if (!this.base64Content || !this.fileName || !this.fileMime) return;

    this.send.emit({
      base64: this.base64Content,
      filename: this.fileName,
      mime: this.fileMime
    });

    this.reset();
  }

  private reset() {
    this.fileName = null;
    this.fileMime = null;
    this.filePreviewIcon = '';
    this.base64Content = null;
  }
}