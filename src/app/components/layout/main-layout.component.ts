import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { AlertComponent } from '../shared/extras/alert/alert.component';
import { User } from '@app/models/auth.model';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';
import { GlobalUnreadService } from '@app/services/global-unread.service';
import { TabNavigationService, Tab } from '../../services/tab-navigation.service';
import { TagIconComponent } from '../settings/tags-management/tag-icon/tag-icon.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, AlertComponent, TagIconComponent],
  template: `
    <div class="min-h-screen bg-[#f8fafc] flex flex-col">
      <!-- Alert Component -->
      <app-alert></app-alert>
      
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main Content Area -->
      <div class="lg:pl-[296px] min-h-screen flex flex-col transition-all duration-300">
        <!-- Topbar -->
        <app-topbar></app-topbar>
        
        <!-- Main Content -->
        <main class="flex-grow p-6 bg-[#f8fafc] overflow-y-auto pb-28">
          <div class="max-w-[1600px] mx-auto animate-fadeIn">
            <ng-content></ng-content>
          </div>
        </main>
      </div>

      <!-- Bottom Tabs Bar (Dynamic Multi-tabs System) -->
      <div *ngIf="tabs.length > 0" 
        class="fixed bottom-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 shadow-lg px-6 py-2 flex items-center justify-between select-none h-14 transition-all duration-300"
        [style.left]="isSidebarCollapsed() ? '72px' : '296px'"
        style="transition-property: left;"
      >
        <div class="flex items-center gap-1.5 overflow-x-auto nav-scroll w-full py-1">
          <div 
            *ngFor="let tab of tabs" 
            (click)="selectTab(tab.url)"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200 border text-xs font-semibold max-w-[160px] flex-shrink-0"
            [ngClass]="activeTabUrl === tab.url ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] shadow-sm' : 'bg-gray-50/50 text-gray-500 border-gray-100 hover:bg-gray-100/50 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            <app-tag-icon [name]="tab.icon || 'Tag'" [classes]="'w-3.5 h-3.5'"></app-tag-icon>
            <span class="truncate">{{ tab.title }}</span>
            <button 
              (click)="closeTab(tab.url, $event)"
              class="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150 text-[10px] ml-1 flex-shrink-0"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Hide scrollbar but allow horizontal scroll */
    .nav-scroll {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .nav-scroll::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  user: User | null = null;
  tabs: Tab[] = [];
  activeTabUrl: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private globalUnreadService: GlobalUnreadService,
    private tabNavService: TabNavigationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.globalUnreadService.init();

    // Subscribe to tabs
    this.tabNavService.tabs$.subscribe(tabs => {
      this.tabs = tabs;
    });

    // Subscribe to active tab
    this.tabNavService.activeTab$.subscribe(activeTab => {
      this.activeTabUrl = activeTab;
    });
  }

  isSidebarCollapsed(): boolean {
    return document.body.classList.contains('sidebar-collapsed');
  }

  selectTab(url: string): void {
    this.router.navigateByUrl(url);
  }

  closeTab(url: string, event: Event): void {
    this.tabNavService.closeTab(url, event);
  }
}
