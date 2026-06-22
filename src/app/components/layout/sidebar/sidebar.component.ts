import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationItems, NavigationGroup, isItem, isGroup } from '../../../models/navigation.model';
import { LanguageService } from '@app/services';
import { NavigationService } from '@app/services/extras/navigation.service';
import { environment } from '@environment';

interface TabSection {
  id: string;
  name: string;
  icon: string;
  items: any[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  navigation: NavigationItems = [];
  appVersion = environment.appVersion;
  currentLocation: string = '/';

  tabs: TabSection[] = [];
  activeTabId: string = 'dashboard';

  constructor(
    private languageService: LanguageService,
    private router: Router,
    private navigationService: NavigationService,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentLocation = event.urlAfterRedirects || event.url;
        this.selectTabByUrl(this.currentLocation);
      });
  }

  ngOnInit(): void {
    this.currentLocation = this.router.url;
    
    this.navigationService.items$.subscribe(items => {
      this.navigation = items;
      this.groupNavigation(items);
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  groupNavigation(items: NavigationItems): void {
    const newTabs: TabSection[] = [];

    // 1. Dashboard Tab
    const dashboardItems = items.filter(isItem).filter(
      item => item.name === 'menu.dashboard' || item.name === 'menu.dashboard-cases'
    );
    if (dashboardItems.length > 0) {
      newTabs.push({
        id: 'dashboard',
        name: 'menu.dashboard',
        icon: 'LayoutDashboard',
        items: dashboardItems.map(i => ({ name: i.name, href: i.href, icon: i.icon || 'LayoutDashboard' }))
      });
    }

    // 2. Chat / Conversations Tab
    const chatItems = items.filter(isItem).filter(
      item => item.name === 'menu.conversations' || item.name === 'menu.whatsapp-campaign-push'
    );
    if (chatItems.length > 0) {
      newTabs.push({
        id: 'conversations',
        name: 'menu.conversations',
        icon: 'MessageCircle',
        items: chatItems.map(i => ({ name: i.name, href: i.href, icon: i.icon || 'MessageCircle' }))
      });
    }

    // 3. Cases Tab
    const casesItems = items.filter(isItem).filter(
      item => item.name === 'menu.cases' || item.name === 'menu.cases-mass-reassignment' || item.name === 'menu.cases-bulk-close'
    );
    if (casesItems.length > 0) {
      newTabs.push({
        id: 'cases',
        name: 'menu.cases',
        icon: 'Package',
        items: casesItems.map(i => ({ name: i.name, href: i.href, icon: i.icon || 'Package' }))
      });
    }

    // Groups tabs
    items.forEach(node => {
      if (isGroup(node)) {
        let icon = 'Folder';
        if (node.name === 'menu.sales') icon = 'TrendingUp';
        else if (node.name === 'menu.maintenance') icon = 'Sliders';
        else if (node.name === 'menu.settings') icon = 'Settings';
        else if (node.name === 'menu.security') icon = 'Shield';
        else if (node.name === 'menu.reports') icon = 'BarChart';

        if (node.children && node.children.length > 0) {
          newTabs.push({
            id: node.name,
            name: node.name,
            icon: icon,
            items: node.children.map(c => ({ name: c.name, href: c.href, icon: c.icon || 'Circle' }))
          });
        }
      }
    });

    this.tabs = newTabs;
    this.selectTabByUrl(this.currentLocation);
  }

  selectTabByUrl(url: string): void {
    const activeTab = this.tabs.find(tab =>
      tab.items.some((item: any) => item.href === url)
    );
    if (activeTab) {
      this.activeTabId = activeTab.id;
    } else {
      const prefixTab = this.tabs.find(tab =>
        tab.items.some((item: any) => url.startsWith(item.href) && item.href !== '/')
      );
      if (prefixTab) {
        this.activeTabId = prefixTab.id;
      } else if (this.tabs.length > 0 && !this.activeTabId) {
        this.activeTabId = this.tabs[0].id;
      }
    }
  }

  isCollapsed = false;

  getActiveTabTop(): number {
    const index = this.tabs.findIndex(t => t.id === this.activeTabId);
    if (index === -1) return 0;
    return index * (44 + 14);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.updateBodyClass();
  }

  updateBodyClass(): void {
    if (this.isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  setActiveTab(tabId: string): void {
    this.activeTabId = tabId;

    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.updateBodyClass();
    }

    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && tab.items.length > 0) {
      const isAlreadyOnTabItem = tab.items.some((item: any) => this.currentLocation === item.href);
      if (!isAlreadyOnTabItem) {
        this.router.navigate([tab.items[0].href]);
      }
    }
  }

  getActiveTabName(): string {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    return tab ? tab.name : '';
  }

  getActiveTabItems(): any[] {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    return tab ? tab.items : [];
  }
}