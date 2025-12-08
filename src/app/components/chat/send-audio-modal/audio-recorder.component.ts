import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.css']
})
export class AudioRecorderComponent {

  @Output() send = new EventEmitter<{ base64: string, filename: string, mime: string }>();
  @Output() cancel = new EventEmitter<void>();

  isRecording = false;

  private mediaRecorder!: MediaRecorder;
  private chunks: BlobPart[] = [];

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });

        const base64 = await this.convertBlobToBase64(blob);
        const filename = `audio_${Date.now()}.webm`;

        this.send.emit({
          base64,
          filename,
          mime: 'audio/webm'
        });

        // CERRAR MODAL AUTOMÁTICO
        this.cancel.emit();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error("No se pudo iniciar grabación:", err);
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return;

    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }
}