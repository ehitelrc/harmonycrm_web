// src/app/models/navigation.model.ts
export interface NavigationItem {
  type: 'item';
  name: string;
  href: string;
  icon: string;
  permission: string;
}

export interface NavigationGroup {
  type: 'group';
  name: string;
  icon?: string;
  children: NavigationItem[];
}

 

export interface NavigationItem { type:'item'; name:string; href:string; icon:string; permission:string;   }
export interface NavigationGroup { type:'group'; name:string; icon?:string; children:NavigationItem[]; }
export type NavigationNode = NavigationItem | NavigationGroup;
export type NavigationItems = ReadonlyArray<NavigationNode>;
export function isItem(node: NavigationNode): node is NavigationItem { return node.type === 'item'; }
export function isGroup(node: NavigationNode): node is NavigationGroup { return node.type === 'group'; }