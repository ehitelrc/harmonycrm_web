import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

export interface WSMessage {
  type: 'new_message' | string;
  case_id: number;
  data: any; // el mensaje o DTO que envías desde el backend
}

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;
  private stream$ = new Subject<WSMessage>();
  private alive = false;
  private reconnectDelayMs = 3000;
  private currentUrl = '';

  constructor(private zone: NgZone) {}

  connect(url: string): Observable<WSMessage> {
    this.currentUrl = url;
    this.alive = true;
    this.open();

    return this.stream$.asObservable();
  }

  private open() {
    if (!this.currentUrl) return;

    this.socket = new WebSocket(this.currentUrl);

    this.socket.onmessage = (ev) => {
      this.zone.run(() => {
        try {
          const msg = JSON.parse(ev.data) as WSMessage;
          this.stream$.next(msg);
        } catch {
          // ignora mensajes no JSON
        }
      });
    };

    this.socket.onclose = () => {
      if (this.alive) {
        // reintento simple
        timer(this.reconnectDelayMs).subscribe(() => this.open());
      }
    };

    this.socket.onerror = () => {
      try { this.socket?.close(); } catch {}
    };
  }

  disconnect() {
    this.alive = false;
    try { this.socket?.close(); } catch {}
    this.socket = undefined;
  }
}