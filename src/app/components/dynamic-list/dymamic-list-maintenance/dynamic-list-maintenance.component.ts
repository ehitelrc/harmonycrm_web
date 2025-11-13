import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';
import { CustomListService } from '@app/services/custom-list.service';
import { DynamicListFormComponent } from '../dynamic-list-form/dynamic-list-form.component';
 
@Component({
  selector: 'app-dynamic-lists-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, DynamicListFormComponent],
  templateUrl: 'dynamic-list-maintenance.component.html',
  styleUrls: ['./dynamic-list-maintenance.component.css']
})
export class DynamicListsManagementComponent implements OnInit {

  lists: any[] = [];
  listSelected: any = null;
  
  isFormOpen = false;
  selectedValue: any = null;

  constructor(
    private customListService: CustomListService,
    private lang: LanguageService,
    private alert: AlertService,
  ) {}

  get t() {
    return this.lang.t.bind(this.lang);
  }

  async ngOnInit() {
    await this.loadLists();
  }

  async loadLists() {
    try {
      const resp = await this.customListService.getAllList();
      if (resp.success) {
        this.lists = resp.data; 
      } else {
        //this.alert.error(resp.message);
      }
    } catch {
      this.alert.error(this.t('error_loading_lists'));
    }
  }

  onListChange(event: any) {
    const listId = Number(event.target.value);
    this.listSelected = this.lists.find(l => l.list_id === listId) || null;
  }

  openCreateDialog() {
    this.selectedValue = null;
    this.isFormOpen = true;
  }

  openEditDialog(value: any) {
    this.selectedValue = value;
    this.isFormOpen = true;
  }

  closeDialog() {
    this.isFormOpen = false;
  }

  // Cuando el modal Reporta éxito
  async onSuccess() {
    this.closeDialog();
    // recargar valores del listado
    const updated = await this.customListService.getAllList();
    if (updated.success) {
      this.lists = updated.data;
      this.listSelected = this.lists.find(l => l.list_id === this.listSelected.list_id);
    }
    this.alert.success(this.t('operation_success'));
  }
}