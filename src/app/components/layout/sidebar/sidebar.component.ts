import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationItems, NavigationGroup } from '../../../models/navigation.model'; // 👈 importa Group/Items
import { LanguageService } from '@app/services';
import { NavigationService } from '@app/services/extras/navigation.service';
import { environment } from '@environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  styles: []
})
export class SidebarComponent implements OnInit {
  navigation: NavigationItems = [];
 

  appVersion = environment.appVersion;
  currentLocation: string = '/';

  // 👇 estado de grupos abiertos/cerrados (por nombre)
  openGroups: Record<string, boolean> = {};

  constructor(
    private languageService: LanguageService,
    private router: Router,
    private navigationService: NavigationService,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentLocation = event.url;
      });
  }

  ngOnInit(): void {
    this.currentLocation = this.router.url;
    this.navigation = this.navigationService.getItems();


  // 👇 escucha cambios en items
  this.navigationService.items$.subscribe(items => {
    this.navigation = items;

    // inicializar estado de grupos
    this.navigation.forEach(node => {
      if ((node as NavigationGroup).type === 'group') {
        this.openGroups[(node as NavigationGroup).name] = false;
      }
    });
  });

    // Opcional: abrir todos los grupos al inicio
    // Iniciar todos los grupos colapsados
    // this.navigation.forEach(node => {
    //   if ((node as NavigationGroup).type === 'group') {
    //     const g = node as NavigationGroup;
    //     this.openGroups[g.name] = false; // todos cerrados al inicio
    //   }
    // });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  getItemClasses(href: string): string {
    const isActive = this.currentLocation === href;
    return isActive
      ? 'bg-[#3e66ea] text-white shadow-lg transform scale-105'
      : 'text-white hover:text-white hover:bg-[#3e66ea]/30 hover:rounded-xl hover:transform hover:scale-105';
  }

  // 👇 helpers para grupos
  isOpen(groupName: string): boolean {
    return !!this.openGroups[groupName];
  }

  toggleGroup(groupName: string): void {
    this.openGroups[groupName] = !this.openGroups[groupName];
  }


 

}