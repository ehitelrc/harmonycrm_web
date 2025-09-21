import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { AuthService, LanguageService } from '@app/services';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { ItemService } from '@app/services/item.service';
import { Item } from '@app/models/item.model';
import { ItemsListComponent } from '../item-list/item-list.component';
import { ItemFormComponent } from '../item-form/item-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '@app/services/company.service';
import { Company } from '@app/models/company.model';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CompanyUser } from '@app/models/companies_user_view';


@Component({
  selector: 'app-item-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, ItemsListComponent, ItemFormComponent],
  templateUrl: './item-management.component.html',
  styleUrls: ['./item-management.component.css']
})
export class ItemManagementComponent implements OnInit {
  companyId!: number | null;

  items: Item[] = [];
  isLoading = false;

  isFormOpen = false;
  selectedItem: Item | null = null;

  isDeleteOpen = false;
  deletingId: number | null = null;
  isDeleting = false;

  companies: CompanyUser[] = [];

  loggedUser: UserAuthModel | null = null;


  constructor(
    private authService: AuthService,
    private lang: LanguageService,
    private auth: AuthorizationService,
    private alert: AlertService,
    private service: ItemService,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private router: Router
  ) { }




  get t() { return this.lang.t.bind(this.lang); }
  isAdmin(): boolean { return true; /* o this.auth.isAdmin(); */ }

  async ngOnInit(): Promise<void> {

    this.loggedUser = this.authService.getCurrentUser();

    // 1) Cargar compañías
    await this.loadCompanies();

    // 2) Intentar leer companyId de ruta (si tu ruta lo provee)
    const paramId = this.route.snapshot.paramMap.get('companyId');
    const routeCompanyId = paramId ? Number(paramId) : null;

    if (routeCompanyId && !Number.isNaN(routeCompanyId)) {
      this.companyId = routeCompanyId;
    } else if (this.companies.length > 0) {
      // opcional: seleccionar primera por defecto
      this.companyId = null; // o this.companies[0].id;
    } else {
      this.companyId = null;
    }

    // 3) Si hay compañía seleccionada, cargar ítems
    if (this.companyId) {
      await this.load();
    }
  }

  async loadCompanies(): Promise<void> {
    try {
      this.isLoading = true;
      const r = await this.companyService.getCompaniesByUserId(this.loggedUser?.user_id || 0);
      if (r.success && r.data) this.companies = r.data;
      else this.alert.error(this.t('company.failed_to_load'));
    } catch {
      this.alert.error(this.t('company.failed_to_load'));
    } finally {
      this.isLoading = false;
    }
  }

  async load(): Promise<void> {
    if (!this.companyId) { this.items = []; return; }
    try {
      this.isLoading = true;
      const r = await this.service.getByCompany(this.companyId);
      if (r.success && r.data) this.items = r.data;
      else this.alert.error(this.t('item.failed_to_load_items'));
    } catch {
      this.alert.error(this.t('item.failed_to_load_items'));
    } finally {
      this.isLoading = false;
    }
  }

  // cuando cambia el selector de compañía
  async onCompanyChange(_val: number | null): Promise<void> {
    await this.load();
  }

  backToCompanies(): void {
    this.router.navigate(['/companies']);
  }

  openCreateDialog(): void {
    if (!this.companyId) {
      this.alert.warning(this.t('item.select_company_first'));
      return;
    }
    this.selectedItem = null;
    this.isFormOpen = true;
  }

  openEditDialog(i: Item): void {
    this.selectedItem = i;
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.selectedItem = null;
  }

  async onSuccess(saved: Item): Promise<void> {
    this.closeDialog();
    await this.load();
    this.alert.success(
      this.selectedItem
        ? `${this.t('item.updated_successfully')} (#${saved.id})`
        : `${this.t('item.created_successfully')} (#${saved.id})`
    );
  }

  askDelete(i: Item): void {
    if (!this.isAdmin()) return;
    this.deletingId = i.id;
    this.isDeleteOpen = true;
  }
  cancelDelete(): void {
    this.deletingId = null;
    this.isDeleteOpen = false;
  }
  async confirmDelete(): Promise<void> {
    if (!this.deletingId) return;
    this.isDeleting = true;
    try {
      const r = await this.service.delete(this.deletingId);
      if (r.success) {
        this.alert.success(this.t('item.deleted_successfully'));
        await this.load();
      } else {
        this.alert.error(this.t('item.failed_to_delete_item'));
      }
    } catch {
      this.alert.error(this.t('item.failed_to_delete_item'));
    } finally {
      this.isDeleting = false;
      this.cancelDelete();
    }
  }

  // Hooks del listado
  onEdit(i: Item) { this.openEditDialog(i); }
  onRemove(i: Item) { this.askDelete(i); }
  onView(_i: Item) { /* opcional */ }
}