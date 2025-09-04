import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  // Default route - redirect to dashboard if authenticated, login if not
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Login route - only accessible when not authenticated
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },

  // Dashboard route - requires authentication
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },

  // User Management route - requires authentication
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [AuthGuard]
  },

  // Location Management route - requires authentication
  {
    path: 'locations',
    loadComponent: () => import('./components/locations/location-management/location-management.component').then(m => m.LocationManagementComponent),
    canActivate: [AuthGuard]
  },

  // Inventory Management route - requires authentication
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory/inventory-management/inventory-management.component').then(m => m.InventoryManagementComponent),
    canActivate: [AuthGuard]
  },

  // Article Management route - requires authentication
  {
    path: 'articles',
    loadComponent: () => import('./components/articles/article-management/article-management.component').then(m => m.ArticleManagementComponent),
    canActivate: [AuthGuard]
  },

  // Receiving Tasks Management route - requires authentication
  {
    path: 'receiving-tasks',
    loadComponent: () => import('./components/receiving-tasks/receiving-task-management/receiving-task-management.component').then(m => m.ReceivingTaskManagementComponent),
    canActivate: [AuthGuard]
  },

  // Future protected routes can be added here

  {
    path: 'companies',
    loadComponent: () => import('./components/organization/companies/company-management/company-management.component').then(m => m.CompanyManagementComponent),

  },

  {
    path: 'departments/:companyId',
    loadComponent: () => import('./components/organization/departments/department-management/department-management.component').then(m => m.DepartmentManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'customers',
    loadComponent: () => import('./components/clients/clients-management/client-management.component').then(m => m.ClientManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'departments/:companyId',
    loadComponent: () => import('./components/organization/departments/department-management/department-management.component').then(m => m.DepartmentManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'clients',
    loadComponent: () => import('./components/clients/clients-management/client-management.component').then(m => m.ClientManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'products',
    loadComponent: () => import('./components/items/item-management/item-management.component').then(m => m.ItemManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./components/campaigns/campaign-management/campaign-management.component').then(m => m.CampaignManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'channels',
    loadComponent: () => import('./components/channels/channel-management/channel-management.component').then(m => m.ChannelManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'conversations',
    loadComponent: () => import('./components/chat/chat-workspace.component').then(m => m.ChatWorkspaceComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'funnels',
    loadComponent: () => import('./components/funnels/funnels/management/funnel-management.component').then(m => m.FunnelManagementComponent),
    canActivate: [AuthGuard]
  },

  // app.routes.ts (o el módulo de routing que uses)
  { path: 'funnels/:id/stages', loadComponent: () => import('@app/components/funnels/stages/management/stages-management.component').then(m => m.StagesManagementComponent) },




  // Wildcard route - redirect to dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
