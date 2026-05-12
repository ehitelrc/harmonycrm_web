import { Injectable, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CaseService } from './case.service';
import { AuthService } from './auth.service';
import { environment } from '@environment';

@Injectable({ providedIn: 'root' })
export class GlobalUnreadService {
  private socket?: WebSocket;
  private isConnected = false;

  constructor(
    private titleService: Title,
    private caseService: CaseService,
    private authService: AuthService,
    private zone: NgZone
  ) {}

  public init() {
    if (this.isConnected) return;
    this.isConnected = true;
    this.refreshUnreadCount();
    this.connectWs();
  }

  public refreshUnreadCount() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.caseService.getByAgent(user.user_id).then(res => {
      const cases = Array.isArray(res?.data) ? res.data : [];
      const unreadCount = cases.filter(c => c.unread_count > 0 && c.status !== 'closed').length;
      this.updateTitle(unreadCount);
    });
  }

  private connectWs() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const url = `${environment.socket_url}/ws?agent_id=${user.user_id}`;
    
    this.socket = new WebSocket(url);

    this.socket.onmessage = (ev) => {
      this.zone.run(() => {
        try {
          // Si llega cualquier mensaje, refrescamos el contador.
          // Como es ligero, hacemos una petición para tener el conteo exacto.
          this.refreshUnreadCount();
        } catch {}
      });
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connectWs(), 5000);
    };
  }

  public updateTitle(count: number) {
    if (count > 0) {
      this.titleService.setTitle(`(${count}) HarmonyCRM`);
    } else {
      this.titleService.setTitle(`HarmonyCRM`);
    }
  }
}
