import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { AlertComponent } from '../shared/extras/alert/alert.component';
import { User } from '@app/models/auth.model';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';
import { GlobalUnreadService } from '@app/services/global-unread.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, AlertComponent],
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
        <main class="flex-grow p-6 bg-[#f8fafc] overflow-y-auto pb-24">
          <div class="max-w-[1600px] mx-auto animate-fadeIn">
            <ng-content></ng-content>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {
    user: User | null = null;

    
    
  constructor(
     private authService: AuthService,
     private router: Router,
     private globalUnreadService: GlobalUnreadService
  ) {}

   async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.globalUnreadService.init();
  }

}
