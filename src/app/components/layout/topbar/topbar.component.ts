import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/extras/alert.service';
import { LanguageService } from '../../../services/extras/language.service';
import { AuthorizationService } from '../../../services/extras/authorization.service';
import { NavigationService } from '../../../services/extras/navigation.service';

import { User } from '../../../models/user.model';
import {
  NavigationItem,
  NavigationItems,
  NavigationNode,
  isGroup,
} from '../../../models/navigation.model';

import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit, OnDestroy {
  searchQuery = '';
  user: User | null = null;

  // Ahora pueden venir grupos o items
  items: NavigationItems = [];
  // Sugerencias: solo items (con href)
  filteredItems: NavigationItem[] = [];

  showSuggestions = false;
  activeIndex = 0;
  private subs = new Subscription();

  // Display data from localStorage auth_harmony
  fullName = '';
  firstName = '';
  lastName = '';
  isLogoutDialogOpen = false;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private languageService: LanguageService,
    private router: Router,
    private navigationService: NavigationService,
    private authorizationService: AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.items = this.navigationService.getItems();
  }

  private loadCurrentUser(): void {
    // Subscribe to auth state changes
    this.subs.add(
      this.authService.authState$.subscribe((_authState: any) => {
        this.refreshUserDisplay();
      })
    );
    // Initial load from localStorage
    this.refreshUserDisplay();
  }

  openLogoutConfirm(): void {
    this.isLogoutDialogOpen = true;
  }

  private refreshUserDisplay(): void {
    const stored = this.authorizationService.getCurrentUser() as any;
    let first = stored?.first_name || stored?.name || '';
    let last = stored?.last_name || '';

    // Fallbacks desde user_name si faltan partes
    if (!first || !last) {
      const stateUser = this.authService.getCurrentUser() as any;
      const userName: string | undefined = stateUser?.user_name || stored?.user_name;
      if (userName) {
        const tokens = userName.trim().split(/\s+/);
        if (!first && tokens.length >= 1) first = tokens[0];
        if (!last && tokens.length >= 2) last = tokens[tokens.length - 1];
        if (!last && tokens.length === 1 && !first) first = userName;
      }
    }

    this.firstName = first;
    this.lastName = last;
    const parts = [first, last].filter(Boolean);
    this.fullName = parts.length ? parts.join(' ') : '';
  }

  getInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  async handleLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.alertService.success(
        this.t('auth.logout_success') || 'Sesión cerrada exitosamente',
        this.t('auth.goodbye') || 'Hasta luego'
      );
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout error:', error);
      this.alertService.error(
        error.message || this.t('auth.logout_error') || 'Error al cerrar sesión',
        this.t('auth.logout_failed') || 'Error'
      );
    }
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  onSearchChange(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredItems = [];
      this.showSuggestions = false;
      return;
    }

    // Aplanar grupos -> items
    const allItems: NavigationItem[] = (this.items as ReadonlyArray<NavigationNode>).flatMap(node =>
      isGroup(node) ? node.children : [node]
    );

    // Buscar por etiqueta traducida y path
    this.filteredItems = allItems.filter(item => {
      const translated = this.t(item.name).toLowerCase();
      const nameMatch = translated.includes(query);
      const routeMatch = item.href.toLowerCase().includes(query);
      return nameMatch || routeMatch;
    }).slice(0, 10);

    this.showSuggestions = this.filteredItems.length > 0;
    this.activeIndex = 0;
  }

  openSuggestions(): void {
    if (this.filteredItems.length === 0) {
      this.onSearchChange();
    }
    this.showSuggestions = this.filteredItems.length > 0;
  }

  closeSuggestions(): void {
    this.showSuggestions = false;
  }

  moveActive(delta: number): void {
    if (!this.showSuggestions || this.filteredItems.length === 0) return;
    const newIndex = this.activeIndex + delta;
    if (newIndex < 0) {
      this.activeIndex = this.filteredItems.length - 1;
    } else if (newIndex >= this.filteredItems.length) {
      this.activeIndex = 0;
    } else {
      this.activeIndex = newIndex;
    }
  }

  goToFirstMatch(): void {
    if (!this.filteredItems.length) return;
    const item = this.filteredItems[this.activeIndex] || this.filteredItems[0];
    this.navigate(item);
  }

  navigate(item: NavigationItem): void {
    this.router.navigate([item.href]);
    this.closeSuggestions();
    this.searchQuery = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const closestSearch = target.closest('input[type="search"], .absolute.mt-1');
    if (!closestSearch) {
      this.closeSuggestions();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}