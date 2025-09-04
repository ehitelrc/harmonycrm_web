import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationItems } from '../../models/navigation.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private itemsSubject = new BehaviorSubject<NavigationItems>([
    // Item suelto (no pertenece a grupo)
    { type: 'item', name: 'menu.dashboard', href: '/', icon: 'LayoutDashboard' },

    //  Chats
    { type: 'item', name: 'menu.conversations', href: '/conversations', icon: 'MessageCircle' },

    // Grupo organización
    {
      type: 'group',
      name: 'menu.organization', // clave de traducción, ej: "Organización"
      icon: 'Folder',       // opcional, lo usamos en el HTML
      children: [
        { type: 'item', name: 'menu.companies', href: '/companies', icon: 'Building' },
        //{ type: 'item', name: 'menu.departments', href: '/departments', icon: 'Departments' },

      ],
    },
    // Commerce
    {
      type: 'group',
      name: 'menu.commerce',    // clave de traducción, ej: "Comercio"
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.products', href: '/products', icon: 'Package' },
        { type: 'item', name: 'menu.customers', href: '/customers', icon: 'Users' },
         { type: 'item', name: 'menu.campaigns', href: '/campaigns', icon: 'LayoutDashboard' },


      ],
    },

    // Grupo: Operación
    {
      type: 'group',
      name: 'menu.operation',   // clave de traducción, ej: "Operación"
      icon: 'Folder',      // opcional, lo usamos en el HTML
      children: [
        { type: 'item', name: 'menu.channels', href: '/channels', icon: 'Channels' },
        { type: 'item', name: 'menu.funnels', href: '/funnels', icon: 'Funnel' },
       

      ],
    },

    // Grupo: Configuración
    {
      type: 'group',
      name: 'menu.security',    // clave de traducción, ej: "Configuración"
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.users', href: '/users', icon: 'user' },
        { type: 'item', name: 'menu.agents', href: '/agents', icon: 'agent' },
        { type: 'item', name: 'menu.roles', href: '/roles', icon: 'roles' },
        { type: 'item', name: 'menu.role-permissions', href: '/role-permissions', icon: 'rol-permissions' },
      ],
    },

    {
      type: 'group',
      name: 'menu.reports',    // clave de traducción, ej: "Artículos"
      icon: 'Folder',
      children: [
        { type: 'item', name: 'menu.convertions', href: '/convertions', icon: 'PackageOpen' },

      ],
    }
  ]);

  items$ = this.itemsSubject.asObservable();

  getItems(): NavigationItems {
    return this.itemsSubject.value;
  }

  // opcional: si más adelante quieres actualizar dinámicamente
  setItems(items: NavigationItems): void {
    this.itemsSubject.next(items);
  }
}