import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardCasesComponent } from './components/dashboard-cases/dashboard-cases.component';
import { MainEmptyDashboardComponent } from './components/main-empty-dashboard/main-empy-dashboard.component';

export const routes: Routes = [
  // Default route - redirect to dashboard if authenticated, login if not
  {
    path: '',
    redirectTo: '/main-empty-dashboard',
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
  {
    path: 'main-empty-dashboard',
    component: MainEmptyDashboardComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'dashboard-cases',
    component: DashboardCasesComponent,
    canActivate: [AuthGuard]
  },


  // User Management route - requires authentication
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'agents',
    loadComponent: () => import('./components/agents/agent-user-management/agent-user-management.component').then(m => m.AgentUserManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./components/roles/roles-management/roles-management.component').then(m => m.RolesManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'role-permissions',
    loadComponent: () => import('./components/permissions_role/roles-management/permissions-roles-management.component').then(m => m.PermissionsRoleManagementComponent),
    canActivate: [AuthGuard]
  },

  // Location Management route - requires authentication
  {
    path: 'locations',
    loadComponent: () => import('./components/locations/location-management/location-management.component').then(m => m.LocationManagementComponent),
    canActivate: [AuthGuard]
  },

  // Cases Management route - requires authentication
  {
    path: 'cases',
    loadComponent: () => import('./components/cases/cases-management/cases-management.component').then(m => m.CasesManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cases/mass-reassignment',
    loadComponent: () => import('./components/cases/cases-mass-reassignment/cases-mass-reassignment.component').then(m => m.CasesMassReassignmentComponent),
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


  {
    path: 'report-funnels',
    loadComponent: () => import('./components/funnel-report/funnel-report-management/funnel-report-management.component').then(m => m.FunnelReportManagementComponent),
    canActivate: [AuthGuard]
  },
  //push whatsapp
  {
    path: 'whatsapp-campaign-push',
    loadComponent: () => import('./components/campaign-push/funnel-report/whatsapp-push-management/whatsapp-push-management.component').then(m => m.WhatsappPushManagementComponent),
    canActivate: [AuthGuard]
  },
  ///whatsapp-template
  {
    path: 'whatsapp-template',
    loadComponent: () => import('./components/whatsapp-channel/whatsapp-template-management/template-management.component').then(m => m.TemplateManagementComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'customer-qr',
    loadComponent: () => import('./components/customer-qr/customer-qr-management/customer-qr-management.component').then(m => m.CustomerQRManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'policy',
    loadComponent: () => import('./components/policy/policy.component').then(m => m.PolicyComponent),

  },
  {
    path: 'channel-company',
    loadComponent: () => import('./components/channels-integrations/channel_integration_management/channel-integration-management.component').then(m => m.ChannelIntegrationManagementComponent),
    canActivate: [AuthGuard]
  },
  // Leads Registration
  {
    path: 'leads-registration',
    loadComponent: () => import('./components/leads-registration/leads-management/leads-management.component').then(m => m.LeadsManagementComponent),
    canActivate: [AuthGuard]
  },
  // Dynamic Lists Management
  {
    path: 'custom-lists',
    loadComponent: () => import('./components/dynamic-list/dymamic-list-maintenance/dynamic-list-maintenance.component').then(m => m.DynamicListsManagementComponent),
    canActivate: [AuthGuard]
  },
  // Wildcard route - redirect to dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
