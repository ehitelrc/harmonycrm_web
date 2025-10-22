import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientFormComponent } from '@app/components/clients/clients-form/client-form.component';
import { CaseItemRequest } from '@app/models/case-item.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { Client } from '@app/models/client.model';
import { Item } from '@app/models/item.model';
import { LeadRequest } from '@app/models/lead-request.model';
import { VwCaseItemsDetail } from '@app/models/vw-case-items-detail.model';
import { ClientService } from '@app/services/client.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { ItemService } from '@app/services/item.service';


interface LeadRegistrationForm {
  client_id: number | null;
  client_name: string;
  sender_id: string;
}

interface ItemSelection {
  item_id: number;
  item_name: string;
  quantity: number;
  item_price: number;
  notes?: string;
}

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ClientFormComponent],
  templateUrl: './leads-form.component.html',
  styleUrls: ['./leads-form.component.css'],
})
export class LeadFormComponent implements OnInit {
  /** Caso actual o null si es nuevo */
  @Input() leadData: CaseWithChannel | null = null;
  @Input() companyId: number | null = null;
  @Input() channelId: number | null = null;
  @Input() integrationId: number | null = null;
  @Input() campaign_id: number | null = null;
  @Input() user_id: number | null = null;

  /** Eventos emitidos */
  @Output() assignExisting = new EventEmitter<void>(); // abrir modal de seleccionar cliente
  @Output() assignNew = new EventEmitter<void>();      // abrir modal de nuevo cliente
  @Output() save = new EventEmitter<void>();           // guardar lead
  @Output() cancel = new EventEmitter<void>();         // cancelar edición

  // ======== Estado del modal de asignación ========
  isAssignClientOpen = false;
  clientSearch = '';
  clientResults: Client[] = [];
  isSearchingClients = false;
  selectedClientCandidate: Client | null = null;
  currentClient: Client | null = null;
  tmpClient: Client | null = null;
  isAssigningClient = false;
  isFormOpen = false;

  isLoadingClients = false;

  clients: Client[] = [];
  filteredClients: Client[] = [];

  itemForm: CaseItemRequest = {
    id: null,
    case_id: 0,
    item_id: 0,
    price: 0,
    quantity: 1,
    notes: '',
    acquired: true,
  };


  items: ItemSelection[] = [];


  itemsList: Item[] = [];
  total = 0;


  caseItems: VwCaseItemsDetail[] = [];
  isLoadingCaseItems = false;
  isItemModalOpen = false;
  editingItem: ItemSelection | null = null;

  isDeleteModalOpen = false;
  itemToDelete: number | null = null;

  loadingItems = false;


  //

  constructor(private lang: LanguageService,
    private alert: AlertService,
    private clientService: ClientService,
    private itemService: ItemService,

  ) { }

  get t() {
    return this.lang.t.bind(this.lang);
  }

  ngOnInit(): void {
    // Si el lead ya tiene cliente asignado, cargarlo
    if (this.leadData == null) {
      this.currentClient = null;

    } else {
      this.loadClient(this.leadData?.client_id ? this.leadData.client_id : 0);
    }
  }


  loadClient(id: number) {

    this.clientService.getById(id).then(client => {
      this.currentClient = client.data;
    }).catch(err => {
      console.error('Error loading client:', err);
      this.alert.error('Error cargando cliente');
    });

  }


  // Abre/cierra modal
  openAssignClientModal() {
    this.isAssignClientOpen = true;
    this.clientSearch = '';
    this.clientResults = [];
    this.selectedClientCandidate = null;
    this.isSearchingClients = false;
    this.isAssigningClient = false;
  }

  closeAssignClientModal() {
    this.isAssignClientOpen = false;
    // Limpieza opcional
    this.clientSearch = '';
    this.clientResults = [];
    this.selectedClientCandidate = null;
    this.isSearchingClients = false;
    this.isAssigningClient = false;
  }

  // Recibe el client con id (emitido por el form)
  async onSuccess(saved: Client) {
    this.alert.success(
      this.currentClient
        ? `${this.t('client.updated_successfully')} (#${saved.full_name})`
        : `${this.t('client.created_successfully')} (#${saved.full_name})`
    );

    this.closeDialog();

    this.currentClient = saved;




  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.currentClient = this.tmpClient;
  }

  // Confirmar asignación del cliente al caso
  async confirmAssignClient() {
    if (!this.selectedClientCandidate) return;

    this.isAssigningClient = true;

    try {
      // ✅ Asignar cliente seleccionado al lead actual

      this.currentClient = this.selectedClientCandidate;

      // ✅ Pequeño delay para evitar que Angular reabra el modal en el mismo ciclo
      setTimeout(() => {
        this.isAssignClientOpen = false;
      }, 100);

      this.alert.success(`Cliente asignado correctamente a ${this.selectedClientCandidate.full_name}`);

    } catch (err) {
      console.error('Error asignando cliente:', err);
      this.alert.error('No se pudo asignar el cliente');
    } finally {
      this.isAssigningClient = false;
    }
  }

  addNewClient(): void {
    this.tmpClient = this.currentClient;
    this.currentClient = null;
    this.isFormOpen = true;
  }

  async onClientSearchChange(q: string) {
    const query = (q || '').trim();
    if (!query) {
      this.clientResults = [];
      return;
    }

    try {
      this.isSearchingClients = true;
      // // 👉 Llama a tu servicio real de clientes
      // // Ejemplo esperado: this.clientService.search(query)
      // // Debe devolver [{id, name, email?, phone?}, ...]
      const res = await this.clientService.getAll();

      this.clientResults = Array.isArray(res) ? res : (res?.data || []);

      this.filteredClients = this.clientResults.filter(c =>
        (c.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(query.toLowerCase())
      );

    } catch (e) {
      this.alert.error('Error buscando clientes');
      this.clientResults = [];
      this.isSearchingClients = false;
    } finally {
      this.isSearchingClients = false;
    }
  }


  selectClientCandidate(cli: Client) {
    this.selectedClientCandidate = cli;
  }


  async openAddItemModal() {

    const case_id = this.leadData ? this.leadData.case_id : 0;


    this.itemForm = {
      id: null,
      case_id: case_id,
      item_id: 0,
      price: 0,
      quantity: 1,
      notes: '',
      acquired: false,
    };
    this.total = 0;
    this.isItemModalOpen = true;


    const res = await this.itemService.getByCompany(this.companyId || 0);
    this.itemsList = res.success ? res.data : [];

  }


  openDeleteModal(id: number) {
    const item = this.items.find(i => i.item_id === id);

    if (!item) {
      this.alert.warning('No se encontró el artículo a eliminar.');
      return;
    }


    // 🔥 Elimina el artículo filtrando el array
    this.items = this.items.filter(i => i.item_id !== id);

    this.alert.success(`Artículo "${item.item_name}" eliminado correctamente.`);
  }


  editItem(i: ItemSelection) {

    this.editingItem = i;
    this.isItemModalOpen = true;
  }



  closeItemModal() {
    this.loadingItems = false;
    this.isItemModalOpen = false;
    this.editingItem = null;
  }

  async saveItem() {
    try {
      const selectedItemId = this.itemForm.item_id;

      if (!selectedItemId) {
        this.alert.error('Debe seleccionar un artículo antes de guardar.');
        return;
      }

      // 🔍 Verifica si ya existe un artículo con el mismo item_id
      const existing = this.items.find(i => i.item_id === selectedItemId);

      if (existing && !this.editingItem) {
        this.alert.warning('Este artículo ya ha sido agregado.');
        return;
      }

      // ✅ Si está editando un artículo, actualiza los valores
      if (this.editingItem) {
        this.editingItem.item_id = selectedItemId;
        this.editingItem.item_name =
          this.itemsList.find(it => it.id === selectedItemId)?.name || '';
        this.editingItem.quantity = this.itemForm.quantity || 0;
        this.editingItem.item_price = this.itemForm.price || 0;
        this.editingItem.notes = this.itemForm.notes || '';
        this.alert.success('Artículo actualizado correctamente.');
      } else {
        // ✅ Si es nuevo, agrégalo a la lista
        this.items.push({
          item_id: selectedItemId,
          item_name: this.itemsList.find(it => it.id === selectedItemId)?.name || '',
          quantity: this.itemForm.quantity || 0,
          item_price: this.itemForm.price || 0,
          notes: this.itemForm.notes || '',
        });
        this.alert.success('Artículo agregado correctamente.');
      }

      this.closeItemModal();
    } catch (err) {
      console.error(err);
      this.alert.error('No se pudo guardar el artículo');
    }
  }

  async deleteItem(id: number) {
    if (!confirm('¿Deseas eliminar este artículo?')) return;
    try {

      this.alert.success('Artículo eliminado');

    } catch {
      this.alert.error('Error al eliminar el artículo');
    }
  }

  updateTotal() {
    this.total = (this.itemForm.price || 0) * (this.itemForm.quantity || 0);
  }

  onItemSelected() {
    const selected = this.itemsList.find(it => it.id === this.itemForm.item_id);
    if (selected) {
      this.itemForm.price = selected.item_price ?? 0; // Usa el precio del item o 0 si no existe
    }
    this.updateTotal();
  }

  cancelForm() {

    this.cancel.emit();
  }

  acceptForm() {

    if (!this.currentClient) {
      this.alert.error('Debe asignar un cliente antes de guardar el lead.');
      return;
    }

    const leadPayload: LeadRequest = {
      client_id: this.currentClient.id,
      company_id: this.companyId!,
      campaign_id: this.campaign_id!,
      channel_id: this.channelId!,
      channel_integration_id: this.integrationId!,
      agent_id: this.user_id!,
      items: this.items.map(i => ({
        item_id: i.item_id,
        item_name: i.item_name,
        quantity: i.quantity,
        item_price: i.item_price,
        notes: i.notes
      }))
    };

    this.clientService.createLeadClient(leadPayload).then(res => {
      if (res.success) {
        this.alert.success('Lead creado correctamente');
        this.save.emit();
      } else {
        this.alert.error('Error creando el lead');
      }
    }).catch(err => {
      console.error('Error creating lead client:', err);
      this.alert.error('Error creando el lead');
    });


  }

}