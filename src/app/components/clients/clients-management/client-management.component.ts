import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { ClientService } from '@app/services/client.service';
import { Client } from '@app/models/client.model';
import { ClientsListComponent } from '../clients-list/client-list.component';
import { ClientFormComponent } from '../clients-form/client-form.component';

@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, ClientsListComponent, ClientFormComponent],
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent {
  clients: Client[] = [];
  isLoading = false;

  isFormOpen = false;
  selectedClient: Client | null = null;

  // diálogo de confirmación de borrado
  isDeleteOpen = false;
  deletingId: number | null = null;
  isDeleting = false;


  showingDuplicates = false;

  constructor(
    private lang: LanguageService,
    private auth: AuthorizationService,
    private alert: AlertService,
    private service: ClientService
  ) { }

  get t() { return this.lang.t.bind(this.lang); }
  isAdmin(): boolean { return this.auth.isAdmin(); }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      this.isLoading = true;
      const r = await this.service.getAll();
      if (r.success && r.data) this.clients = r.data;
      else this.alert.error(this.t('client.failed_to_load_clients'));
    } catch {
      this.alert.error(this.t('client.failed_to_load_clients'));
    } finally {
      this.isLoading = false;
    }
  }

  openCreateDialog(): void {
    this.selectedClient = null;
    this.isFormOpen = true;
  }

  openEditDialog(c: Client): void {
    this.selectedClient = c;
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.selectedClient = null;
  }

  // Recibe el client con id (emitido por el form)
  async onSuccess(saved: Client): Promise<void> {
    this.closeDialog();
    await this.load();
    this.alert.success(
      this.selectedClient
        ? `${this.t('client.updated_successfully')} (#${saved.id})`
        : `${this.t('client.created_successfully')} (#${saved.id})`
    );
  }

  // Delete modal
  askDelete(c: Client): void {
    if (!this.isAdmin()) return;
    this.deletingId = c.id;
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
        this.alert.success(this.t('client.deleted_successfully'));
        await this.load();
      } else {
        this.alert.error(this.t('client.failed_to_delete_client'));
      }
    } catch {
      this.alert.error(this.t('client.failed_to_delete_client'));
    } finally {
      this.isDeleting = false;
      this.cancelDelete();
    }
  }

  // Hooks del listado
  onEdit(c: Client) { this.openEditDialog(c); }
  onRemove(c: Client) { this.askDelete(c); }
  onView(_c: Client) {
    // si quisieras un modal de detalle, puedes implementarlo igual que en companies
  }

  async toggleDuplicates(): Promise<void> {
    if (this.showingDuplicates) {
      // 🔁 Volver a listado normal
      this.showingDuplicates = false;
      await this.load();
      return;
    }

    try {
      this.isLoading = true;
      const r = await this.service.getDuplicatePhones();

      if (r.success && r.data) {
        // 🔹 Flatten: grupos → lista de clientes
        this.clients = r.data.flatMap(g =>
          g.clients.map(c => ({
            ...c,
            // opcional: marcar que es duplicado
            _duplicate_phone: g.phone,
            _duplicate_count: g.count
          }))
        );

        this.showingDuplicates = true;
      } else {
        this.alert.error(this.t('client.failed_to_load_duplicates'));
      }
    } catch {
      this.alert.error(this.t('client.failed_to_load_duplicates'));
    } finally {
      this.isLoading = false;
    }
  }
}