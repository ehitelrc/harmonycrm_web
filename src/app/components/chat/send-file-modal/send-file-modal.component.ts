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
  @Input() startInAudioMode = false;

  @Output() send = new EventEmitter<{
    base64: string;
    filename: string;
    mime: string;
  }>();

  // =========================================================
  // ARCHIVOS (lógica original intacta)
  // =========================================================
  fileName: string | null = null;
  fileMime: string | null = null;
  filePreviewIcon = '';
  base64Content: string | null = null;

  // =========================================================
  // AUDIO
  // =========================================================
  isRecording = false;
  recordedAudioUrl: string | null = null;   // para preview
  recordedMime: string | null = null;
  recorder!: MediaRecorder;
  audioChunks: Blob[] = [];

  // ===== DRAG & DROP =====
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  // ===== CLIPBOARD =====
  onPaste(event: ClipboardEvent) {
    const file = event.clipboardData?.files?.[0];
    if (file) this.readFile(file);
  }

  // ===== INPUT FILE =====
  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File) {
    this.resetAudio(); // evitar conflictos

    this.fileName = file.name;
    this.fileMime = file.type;
    this.filePreviewIcon = this.getIcon(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.base64Content = base64;
    };
    reader.readAsDataURL(file);
  }

  private getIcon(mime: string): string {
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('zip')) return '🗜️';
    if (mime.includes('word') || mime.includes('doc')) return '📘';
    if (mime.includes('excel') || mime.includes('sheet')) return '📗';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('audio')) return '🎵';
    return '📄';
  }

  // =========================================================
  // GRABACIÓN DE AUDIO
  // =========================================================
  async startRecording() {
    this.resetFile(); // evitar conflicto visual
    this.recordedAudioUrl = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioChunks = [];
      this.isRecording = true;

      this.recorder = new MediaRecorder(stream);
      this.recordedMime = this.recorder.mimeType;

      this.recorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };

      this.recorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.recordedMime || 'audio/webm' });
        this.recordedAudioUrl = URL.createObjectURL(blob);
      };

      this.recorder.start();
    } catch (err) {
      console.error("No se pudo iniciar grabación:", err);
    }
  }

  stopRecording() {
    if (!this.recorder || this.recorder.state !== 'recording') return;
    this.isRecording = false;
    this.recorder.stop();
  }

  discardRecording() {
    this.resetAudio();
  }

  async sendRecordedAudio() {
    if (!this.recordedAudioUrl) return;

    const blob = await fetch(this.recordedAudioUrl).then(r => r.blob());
    const base64 = await this.blobToBase64(blob);

    const filename = `audio_${Date.now()}.webm`;
    const mime = blob.type || 'audio/webm';

    this.send.emit({
      base64: base64,
      filename: filename,
      mime: mime
    });

    this.reset();
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  // =========================================================
  // BOTONES DE LA UI
  // =========================================================
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

  // =========================================================
  // RESET
  // =========================================================
  private reset() {
    this.resetFile();
    this.resetAudio();
  }

  private resetFile() {
    this.fileName = null;
    this.fileMime = null;
    this.filePreviewIcon = '';
    this.base64Content = null;
  }

  private resetAudio() {
    this.isRecording = false;
    this.recordedAudioUrl = null;
    this.recordedMime = null;
    this.audioChunks = [];
  }
}