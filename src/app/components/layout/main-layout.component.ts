import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { AlertComponent } from '../shared/extras/alert/alert.component';
import { User } from '@app/models/auth.model';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, AlertComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Alert Component -->
      <app-alert></app-alert>
      
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main Content Area -->
      <div class="lg:pl-64">
        <!-- Topbar -->
        <app-topbar></app-topbar>
        
        <!-- Main Content -->
        <main class="flex-1 space-y-6 h-screen overflow-y-auto p-6 pb-32">
          <div class="py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <ng-content></ng-content>
            </div>
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
     private router: Router
  ) {}

   async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
 
  }

}
