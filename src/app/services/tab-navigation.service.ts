import { Injectable, Injector } from '@angular/core';
import { Router, NavigationEnd, RouteReuseStrategy } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CustomRouteReuseStrategy } from './extras/custom-route-reuse-strategy';

export interface Tab {
  url: string;
  title: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TabNavigationService {
  private tabsSubject = new BehaviorSubject<Tab[]>([]);
  tabs$ = this.tabsSubject.asObservable();

  private activeTabSubject = new BehaviorSubject<string>('');
  activeTab$ = this.activeTabSubject.asObservable();

  constructor(private router: Router, private injector: Injector) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      if (url.includes('/login') || url === '') return;
      this.addTab(url);
    });
  }

  get tabs(): Tab[] {
    return this.tabsSubject.value;
  }

  get activeTabUrl(): string {
    return this.activeTabSubject.value;
  }

  addTab(url: string) {
    const title = this.getRouteTitle(url);
    const existing = this.tabs.find(t => t.url === url);

    if (!existing) {
      const newTab: Tab = { url, title, icon: this.getRouteIcon(url) };
      this.tabsSubject.next([...this.tabs, newTab]);
    }
    this.activeTabSubject.next(url);
  }

  closeTab(url: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const currentTabs = this.tabs;
    const index = currentTabs.findIndex(t => t.url === url);
    if (index === -1) return;

    const newTabs = currentTabs.filter(t => t.url !== url);
    this.tabsSubject.next(newTabs);

    try {
      const strategy = this.injector.get(RouteReuseStrategy) as CustomRouteReuseStrategy;
      if (strategy && typeof strategy.clearHandle === 'function') {
        strategy.clearHandle(url);
      }
    } catch (e) {
      console.warn('Error clearing RouteReuseStrategy handle', e);
    }

    if (this.activeTabUrl === url) {
      if (newTabs.length > 0) {
        const nextActiveIndex = Math.min(index, newTabs.length - 1);
        this.router.navigateByUrl(newTabs[nextActiveIndex].url);
      } else {
        this.router.navigateByUrl('/');
      }
    }
  }

  private getRouteTitle(url: string): string {
    const cleanPath = url.split('?')[0];
    
    if (cleanPath === '/' || cleanPath === '/dashboard') return 'Tablero';
    if (cleanPath === '/dashboard-cases') return 'Tablero Casos';
    if (cleanPath === '/conversations') return 'Chats';
    if (cleanPath === '/whatsapp-campaign-push') return 'Masivo WA';
    if (cleanPath === '/cases') return 'Casos';
    if (cleanPath === '/cases/mass-reassignment') return 'Reasignación';
    if (cleanPath === '/cases/bulk-close') return 'Cierre Masivo';
    if (cleanPath === '/leads-registration') return 'Leads';
    if (cleanPath === '/customer-qr') return 'QR Clientes';
    if (cleanPath === '/products') return 'Productos';
    if (cleanPath === '/companies') return 'Compañías';
    if (cleanPath === '/campaigns') return 'Campañas';
    if (cleanPath === '/funnels') return 'Embudos';
    if (cleanPath === '/customers') return 'Clientes';
    if (cleanPath === '/custom-lists') return 'Listas';
    if (cleanPath === '/tags') return 'Tags';
    if (cleanPath === '/channels') return 'Canales';
    if (cleanPath === '/whatsapp-template') return 'Plantillas';
    if (cleanPath === '/channel-company') return 'Canales Cía';
    if (cleanPath === '/users') return 'Usuarios';
    if (cleanPath === '/agents') return 'Agentes';
    if (cleanPath === '/roles') return 'Roles';
    if (cleanPath === '/role-permissions') return 'Permisos';
    if (cleanPath === '/payment-validations') return 'Validaciones';
    if (cleanPath === '/unreconciled-payments') return 'Pagos ERP';
    if (cleanPath === '/report-funnels') return 'Conversiones';

    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length === 0) return 'Inicio';
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  }

  private getRouteIcon(url: string): string {
    const cleanPath = url.split('?')[0];
    if (cleanPath === '/' || cleanPath === '/dashboard') return 'LayoutDashboard';
    if (cleanPath === '/conversations') return 'MessageCircle';
    if (cleanPath === '/cases') return 'Package';
    if (cleanPath === '/tags') return 'Settings';
    return 'Tag';
  }
}
