import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationItems } from '../../models/navigation.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private fullMenu: NavigationItems = [
    { type: 'item', name: 'menu.dashboard', href: '/', icon: 'LayoutDashboard', permission: 'dashboard.access' },
     { type: 'item', name: 'menu.dashboard-cases', href: '/dashboard-cases', icon: 'LayoutDashboard', permission: 'dashboard.access' },
    { type: 'item', name: 'menu.conversations', href: '/conversations', icon: 'MessageCircle', permission: 'conversations.access' },

    {
      type: 'group',
      name: 'menu.organization',
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.companies', href: '/companies', icon: 'Building', permission: 'companies.access' },
      ],
    },
    {
      type: 'group',
      name: 'menu.commerce',
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.cases', href: '/cases', icon: 'Package', permission: 'cases.access' },
        { type: 'item', name: 'menu.products', href: '/products', icon: 'Package', permission: 'products.access' },
        { type: 'item', name: 'menu.customers', href: '/customers', icon: 'Users', permission: 'customers.access' },
        { type: 'item', name: 'menu.campaigns', href: '/campaigns', icon: 'LayoutDashboard', permission: 'campaigns.access' },
        { type: 'item', name: 'menu.whatsapp-campaign-push', href: '/whatsapp-campaign-push', icon: 'UserPlus', permission: 'whatsapp-campaign-push.access' },
        { type: 'item', name: 'menu.customer-qr', href: '/customer-qr', icon: 'QR', permission: 'customer-qr.access' },
      ],
    },
    {
      type: 'group',
      name: 'menu.operation',
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.channels', href: '/channels', icon: 'Channels', permission: 'channels.access' },
        { type: 'item', name: 'menu.funnels', href: '/funnels', icon: 'Funnel', permission: 'funnels.access' },
        { type: 'item', name: 'menu.whatsapp-template', href: '/whatsapp-template', icon: 'Settings', permission: 'whatsapp-template.access' },
        {  type: 'item', name: 'menu.channels_company', href: '/channel-company', icon: 'CheckCircle', permission: 'channels_company.access' },
      ],
    },
    {
      type: 'group',
      name: 'menu.security',
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.users', href: '/users', icon: 'user', permission: 'users.access' },
        { type: 'item', name: 'menu.agents', href: '/agents', icon: 'agent', permission: 'agents.access' },
        { type: 'item', name: 'menu.roles', href: '/roles', icon: 'roles', permission: 'roles.access' },
        { type: 'item', name: 'menu.role-permissions', href: '/role-permissions', icon: 'rol-permissions', permission: 'role-permissions.access' },
      
      ],
    },
    {
      type: 'group',
      name: 'menu.reports',
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.convertions', href: '/report-funnels', icon: 'PackageOpen', permission: 'reports.access' },
      ],
    }
  ];

  private itemsSubject = new BehaviorSubject<NavigationItems>([]);
  items$ = this.itemsSubject.asObservable();

  setPermissions(perms: string[]): void {
    const filtered = this.fullMenu
      .map(item => {
        if (item.type === 'item') {
          return perms.includes(item.permission!) ? item : null;
        } else if (item.type === 'group') {
          const children = item.children?.filter(child => perms.includes(child.permission!)) || [];
          return children.length > 0 ? { ...item, children } : null;
        }
        return null;
      })
      .filter(Boolean) as NavigationItems;

    this.itemsSubject.next(filtered);
  }

  getItems(): NavigationItems {
    return this.itemsSubject.value;
  }
}

// @Injectable({ providedIn: 'root' })
// export class NavigationService {
//   private itemsSubject = new BehaviorSubject<NavigationItems>([
//     // Item suelto (no pertenece a grupo)
//     { type: 'item', name: 'menu.dashboard', href: '/', icon: 'LayoutDashboard' },

//     //  Chats
//     { type: 'item', name: 'menu.conversations', href: '/conversations', icon: 'MessageCircle' },

//     // Grupo organización
//     {
//       type: 'group',
//       name: 'menu.organization', // clave de traducción, ej: "Organización"
//       icon: 'Folder',       // opcional, lo usamos en el HTML
//       children: [
//         { type: 'item', name: 'menu.companies', href: '/companies', icon: 'Building' },
//         //{ type: 'item', name: 'menu.departments', href: '/departments', icon: 'Departments' },

//       ],
//     },
//     // Commerce
//     {
//       type: 'group',
//       name: 'menu.commerce',    // clave de traducción, ej: "Comercio"
//       icon: 'Folder',
//       children: [
//         { type: 'item', name: 'menu.products', href: '/products', icon: 'Package' },
//         { type: 'item', name: 'menu.customers', href: '/customers', icon: 'Users' },
//          { type: 'item', name: 'menu.campaigns', href: '/campaigns', icon: 'LayoutDashboard' },


//       ],
//     },

//     // Grupo: Operación
//     {
//       type: 'group',
//       name: 'menu.operation',   // clave de traducción, ej: "Operación"
//       icon: 'Folder',      // opcional, lo usamos en el HTML
//       children: [
//         { type: 'item', name: 'menu.channels', href: '/channels', icon: 'Channels' },
//         { type: 'item', name: 'menu.funnels', href: '/funnels', icon: 'Funnel' },
       

//       ],
//     },

//     // Grupo: Configuración
//     {
//       type: 'group',
//       name: 'menu.security',    // clave de traducción, ej: "Configuración"
//       icon: 'Folder',
//       children: [
//         { type: 'item', name: 'menu.users', href: '/users', icon: 'user' },
//         { type: 'item', name: 'menu.agents', href: '/agents', icon: 'agent' },
//         { type: 'item', name: 'menu.roles', href: '/roles', icon: 'roles' },
//         { type: 'item', name: 'menu.role-permissions', href: '/role-permissions', icon: 'rol-permissions' },
//       ],
//     },

//     {
//       type: 'group',
//       name: 'menu.reports',    // clave de traducción, ej: "Artículos"
//       icon: 'Folder',
//       children: [
//         { type: 'item', name: 'menu.convertions', href: '/convertions', icon: 'PackageOpen' },

//       ],
//     }
//   ]);

//   items$ = this.itemsSubject.asObservable();

//   getItems(): NavigationItems {
//     return this.itemsSubject.value;
//   }

//   // opcional: si más adelante quieres actualizar dinámicamente
//   setItems(items: NavigationItems): void {
//     this.itemsSubject.next(items);
//   }
// }