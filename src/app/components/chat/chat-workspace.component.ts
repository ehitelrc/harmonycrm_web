import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { buildAgentTextMessage } from '@app/models/agent-message.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { Client } from '@app/models/client.model';
import { Message } from '@app/models/message.model';
import { AssignCaseToCampaignPayload, CaseFunnelCurrent, CaseFunnelEntry, CaseService, VwCaseCurrentStage } from '@app/services/case.service';
import { ClientService } from '@app/services/client.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { WSMessage, WsService } from '@app/services/extras/ws.service';
import { Subscription } from 'rxjs';
import { ClientFormComponent } from "../clients/clients-form/client-form.component";
import { CaseNote } from '@app/models/case-notes.model';
import { AuthService } from '@app/services';
import { CaseNoteView } from '@app/models/case-notes-view.model';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { CampaignService } from '@app/services/campaign.service';
import { MoveStageModalComponent } from './stage_movement/move-stage-modal.component';
import { MoveCaseStagePayload } from '@app/models/move_case_stager_payload';
import { ThisReceiver } from '@angular/compiler';
import { VwCaseItemsDetail } from '@app/models/vw-case-items-detail.model';
import { CaseItemService } from '@app/services/case-items.service';
import { CaseItemRequest } from '@app/models/case-item.model';
import { ItemService } from '@app/services/item.service';
import { Item } from '@app/models/item.model';
import { environment } from '@environment';

@Component({
  selector: 'app-chat-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientFormComponent, MoveStageModalComponent],
  templateUrl: './chat-workspace.component.html',
  styleUrls: ['./chat-workspace.component.css']
})
export class ChatWorkspaceComponent implements OnInit, OnDestroy {

  currentCaseFunnel: VwCaseCurrentStage | null = null;

  isCloseCaseOpen = false;
  closeNote = '';
  isClosingCase = false;


  // En tu componente padre
  isMoveStageOpen = false;
  currentStage: VwCaseCurrentStage | null = null;


  isChangeStatusOpen = false;

  isHistoryOpen = false;
  isLoadingHistory = false;
  history: CaseFunnelEntry[] = [];

  // ======== Estado del modal de campaña ========
  isAssignCampaignOpen = false;
  campaignSearch = '';
  campaigns: CampaignWithFunnel[] = [];
  filteredCampaigns: CampaignWithFunnel[] = [];
  selectedCampaignCandidate: CampaignWithFunnel | null = null;
  isLoadingCampaigns = false;
  isAssigningCampaign = false;
  currentCampaign: CampaignWithFunnel | null = null;


  // Case mode view
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


  // --- Estado UI ---
  isLoadingCases = false;
  isLoadingMessages = false;
  searchContact = '';
  isRightPanelOpen = false;

  // --- Datos ---
  cases: CaseWithChannel[] = [];
  filteredCases: CaseWithChannel[] = [];
  selectedCase: CaseWithChannel | null = null;
  messages: Message[] = [];

  // Notas del caso
  isLoadingNotes = false;
  isSavingNote = false;
  newNote = '';
  notes: CaseNoteView[] = [];

  //

  draft = '';
  isAttachmentModalOpen = false;
  viewingAttachment: Message | null = null;
  agent_id: number | null = null;

  private wsSub?: Subscription;
  private tmpCounter = 0;

  // Visor de imagen
  imageLoaded = false;
  zoomLevel = 1;       // 1 = 100%
  fitToScreen = true;  // true: object-contain, false: tamaño original con zoom

  // Índice del adjunto de imagen que se está viendo (dentro de imageAttachments)
  viewingIndex = -1;

  authData: any;

  caseItems: VwCaseItemsDetail[] = [];
  isLoadingCaseItems = false;
  isItemModalOpen = false;
  editingItem: VwCaseItemsDetail | null = null;

  itemForm: CaseItemRequest = {
    id: null,
    case_id: 0,
    item_id: 0,
    price: 0,
    quantity: 1,
    notes: '',
    acquired: true,
  };

  itemsList: Item[] = [];
  total = 0;

  isDeleteModalOpen = false;
  itemToDelete: number | null = null;




  constructor(
    private lang: LanguageService,
    private chatService: CaseService,
    private alert: AlertService,
    private caseItemService: CaseItemService,
    private ws: WsService,
    private clientService: ClientService,
    private authService: AuthService,
    private campaignService: CampaignService,
    private itemService: ItemService,

  ) { }

  ngOnInit(): void { this.onInit(); }


  ngOnDestroy(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
  }

  get t() { return this.lang.t.bind(this.lang); }

  // Íconos por canal
  channelIconMap: Record<string, string> = {
    whatsapp: 'assets/icons/whatsapp.svg',
    messenger: 'assets/icons/messenger.svg',
    instagram: 'assets/icons/instagram.svg',
    facebook: 'assets/icons/facebook.svg',
    telegram: 'assets/icons/telegram.svg',
  };

  async onInit() {
    let stateUser = this.authService.getCurrentUser();

    this.authData = this.authService.getStoredAuthData();

    this.agent_id = stateUser?.user_id || null;

    console.log('Agent ID:', this.agent_id);

    if (!this.agent_id) return;


    await this.loadCases();

    // // Construir la URL del WebSocket
    // let wsBase = environment.API.BASE
    //   .replace('http', 'ws')
    //   .replace('/api', '')
    //   .replace('https', 'wss');

    // // wscat -c "wss://harmony.ngrok.dev/ws?agent_id=23"
    // const wsUrl = `${wsBase}/ws?case=${this.ca}`;
    // console.log('Conectando a WebSocket en:', wsUrl);
    // // Suscribirse al WebSocket general
    // this.wsSub = this.ws.connect(wsUrl).subscribe({
    //   next: (msg) => {
    //     console.log('🔔 Mensaje WebSocket recibido:', msg);

    //     // Ejemplo: notificar si llega un nuevo mensaje global
    //     if (msg.type === 'new_message') {
    //       const targetCase = this.cases.find(c => c.case_id === msg.case_id);
    //       if (targetCase) {
    //         targetCase.unread_count = (targetCase.unread_count || 0) + 1;
    //         targetCase.last_message_preview = '[Nuevo mensaje]';
    //         this.applyContactFilter();
    //       }
    //     }
    //   },
    //   error: (err) => console.error('Error en WebSocket:', err),
    // });
  }

  async loadCases() {
    try {
      this.isLoadingCases = true;
      const r = await this.chatService.getByAgent(this.agent_id!);
      const arr = Array.isArray(r?.data) ? r.data : [];
      this.cases = arr.map((c: any) => ({
        ...c,
        case_id: c.case_id ?? c.id,
        client_name: c.client_name ?? '',
        unread_count: c.unread_count ?? 0,
        last_message_preview: c.last_message_preview ?? '',
      }));
      this.applyContactFilter();
    } catch {
      this.alert.error(this.t('chat.failed_to_load_cases'));
      this.cases = [];
    } finally {
      this.isLoadingCases = false;
    }
  }

  applyContactFilter() {
    const q = (this.searchContact || '').toLowerCase().trim();
    this.filteredCases = this.cases.filter(c =>
      !q ||
      (c.client_name || '').toLowerCase().includes(q) ||
      String(c.case_id).includes(q)
    );
  }

  channelIcon(channelCode: string): string {
    return this.channelIconMap[channelCode?.toLowerCase()] || 'assets/icons/default-channel.svg';
  }

  getMessageType(m: string): string {
    if (m === 'image') return 'IMAGEN';
    if (m === 'audio') return 'AUDIO';
    if (m === 'file') return 'ARCHIVO';
    if (m === 'text') return 'TEXTO';
    return 'DESCONOCIDO';
  }

  async selectCase(c: CaseWithChannel) {
    // Cierra WS previo
    this.ws.disconnect();
    this.wsSub?.unsubscribe();

    this.selectedCase = null;
    this.messages = [];
    this.isLoadingMessages = true;

    try {
      // 1) Histórico
      const result = await this.chatService.getMessagesByCase(c.case_id);
      this.messages = Array.isArray(result?.data) ? result.data : [];
      this.selectedCase = c;

      // Cargar campaña actual del funnel
      this.campaignService.getById(c.campaign_id || 0).then(res => {
        this.currentCampaign = res?.data || null;
      });

      await this.loadCurrentCaseFunnel(c.case_id);

      await this.loadCurrentStage(c.case_id); // Nueva línea para cargar el estado actual

      if (c.client_id) {
        const clientResponse = await this.clientService.getById(c.client_id);

        if (clientResponse.success) {
          this.currentClient = clientResponse.data || null;
        } else {
          this.currentClient = null;
        }
      }

      // 2) Conexión WS por caso
      let wsBase = environment.API.BASE
        .replace('http', 'ws')
        .replace('/api', '')
        .replace('https', 'wss');

      const url = `${wsBase}/ws?case_id=${c.case_id}`;
      console.log('Conectando a WebSocket en:', url);

      this.wsSub = this.ws.connect(url).subscribe((evt: WSMessage) => {
        if (!this.selectedCase || evt.case_id !== this.selectedCase.case_id) return;

        if (evt.type === 'new_message') {
          const real = this.normalizeApiMessage(evt.data, {
            id: 0,
            case_id: this.selectedCase.case_id,
            sender_type: 'client',
            message_type: 'text',
            text_content: '',
            file_url: null,
            mime_type: null,
            channel_message_id: '',
            created_at: new Date().toISOString(),
            base64_content: null,
          });

          // 1) Reemplazo por client_tmp_id si llega
          const tmpId = (evt.data as any)?.client_tmp_id;
          if (tmpId) {
            const idx = this.messages.findIndex(m => m.channel_message_id === tmpId);
            if (idx >= 0) {
              const copy = [...this.messages];
              copy[idx] = { ...real, channel_message_id: real.channel_message_id || tmpId };
              this.messages = copy;
              this.updatePreview(evt.case_id, real);
              this.scrollToBottomSoon();
              return;
            }
          }

          // 2) Fuzzy match por texto (cuando no hay tmp_id)
          const fuzzyIdx = this.messages.findIndex(m =>
            m.id === 0 &&
            m.sender_type === 'agent' &&
            m.message_type === real.message_type &&
            (m.text_content || '').trim() === (real.text_content || '').trim()
          );
          if (fuzzyIdx >= 0) {
            const copy = [...this.messages];
            copy[fuzzyIdx] = real;
            this.messages = copy;
          } else {
            // 3) Si no hay optimista que reemplazar, evitar duplicados
            const dup = this.messages.some(m =>
              (real.id && m.id === real.id) ||
              (!!real.channel_message_id && m.channel_message_id === real.channel_message_id)
            );
            if (!dup) this.messages = [...this.messages, real];
          }

          this.updatePreview(evt.case_id, real);
          this.scrollToBottomSoon();
        }
      });
    } finally {
      this.isLoadingMessages = false;
    }
  }


  // Helpers render
  isText(m: Message) { return m.message_type === 'text'; }
  isMedia(m: Message) { return m.message_type !== 'text'; }
  isFromAgent(m: Message) { return m.sender_type === 'agent'; }

  // Helpers de adjuntos (URL o Base64)
  private ensureDataPrefix(base64: string | null | undefined, fallbackMime = 'application/octet-stream'): string | null {
    if (!base64) return null;
    if (base64.startsWith('data:')) return base64;
    return `data:${fallbackMime};base64,${base64}`;
  }
  attachmentImageSrc(m: Message | null): string {
    if (!m) return '';
    if (m.base64_content) return this.ensureDataPrefix(m.base64_content, m.mime_type || 'image/*') || '';
    return m.file_url || '';
  }
  attachmentAudioSrc(m: Message | null): string {
    if (!m) return '';
    if (m.base64_content) return this.ensureDataPrefix(m.base64_content, m.mime_type || 'audio/mpeg') || '';
    return m.file_url || '';
  }

  // Lista de adjuntos (para columna derecha)
  get attachmentList(): Message[] {
    return this.messages.filter(this.isMedia);
  }

  // Solo adjuntos de tipo imagen (para navegación)
  get imageAttachments(): Message[] {
    return this.attachmentList.filter(m => m.message_type === 'image');
  }

  openAttachment(m: Message) {
    this.viewingAttachment = m;
    this.isAttachmentModalOpen = true;

    // reset estado del visor
    this.imageLoaded = false;
    this.zoomLevel = 1;
    this.fitToScreen = true;

    // si es imagen, establecer índice para navegación
    if (m.message_type === 'image') {
      const imgs = this.imageAttachments;
      const idx = imgs.findIndex(x =>
        (x.id && m.id && x.id === m.id) ||
        (!!x.channel_message_id && !!m.channel_message_id && x.channel_message_id === m.channel_message_id) ||
        (x.created_at === m.created_at && x.message_type === m.message_type)
      );
      this.viewingIndex = idx;
    } else {
      this.viewingIndex = -1;
    }
  }

  closeAttachmentModal() {
    this.isAttachmentModalOpen = false;
    this.viewingAttachment = null;
    this.imageLoaded = false;
    this.zoomLevel = 1;
    this.fitToScreen = true;
    this.viewingIndex = -1;
  }

  toggleRightPanel() { this.isRightPanelOpen = !this.isRightPanelOpen; }

  async send() {
    const body = this.draft.trim();
    if (!body || !this.selectedCase) return;

    // 1) Mensaje optimista con correlación
    const clientTmpId = `tmp-${Date.now()}-${this.tmpCounter++}`;
    const optimistic: Message = {
      id: 0,
      case_id: this.selectedCase.case_id,
      sender_type: 'agent',
      message_type: 'text',
      text_content: body,
      file_url: null,
      mime_type: null,
      channel_message_id: clientTmpId,
      created_at: new Date().toISOString(),
      base64_content: null,
    };
    this.messages = [...this.messages, optimistic];
    this.draft = '';
    this.scrollToBottomSoon();

    try {
      // 2) Enviar al backend (espera WS para reemplazar)
      const payload = buildAgentTextMessage(this.selectedCase.case_id, body);
      (payload as any).client_tmp_id = clientTmpId;
      await this.chatService.sendText(payload);
    } catch {
      this.alert.error(this.t('chat.failed_to_send'));
      // Revierte optimista si falla
      this.messages = this.messages.filter(m => m.channel_message_id !== clientTmpId);
    }
  }

  private scrollToBottomSoon() {
    setTimeout(() => {
      const box = document.querySelector('.chat-scrollbox') as HTMLElement | null;
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
  }

  private normalizeApiMessage(api: any, fallback: Message): Message {
    if (!api) return fallback;

    // Si ya es Message
    if (api.text_content !== undefined || api.created_at !== undefined) {
      return {
        id: api.id ?? fallback.id,
        case_id: api.case_id ?? fallback.case_id,
        sender_type: api.sender_type ?? fallback.sender_type,
        message_type: api.message_type ?? fallback.message_type,
        text_content: api.text_content ?? fallback.text_content,
        file_url: api.file_url ?? null,
        mime_type: api.mime_type ?? null,
        channel_message_id: api.channel_message_id ?? fallback.channel_message_id ?? '',
        created_at: api.created_at ?? fallback.created_at,
        base64_content: api.base64_content ?? null,
      };
    }

    // AgentMessage -> Message
    return {
      id: 0,
      case_id: api.case_id ?? fallback.case_id,
      sender_type: api.sender_type ?? 'agent',
      message_type: api.message_type ?? 'text',
      text_content: api.text_message ?? fallback.text_content,
      file_url: null,
      mime_type: null,
      channel_message_id: (api.client_tmp_id ?? '') || fallback.channel_message_id || '',
      created_at: new Date().toISOString(),
      base64_content: null,
    };
  }

  private updatePreview(caseId: number, m: Message) {
    const preview = m.message_type === 'text' ? (m.text_content || '') : `[${m.message_type}]`;
    const idx = this.cases.findIndex(x => x.case_id === caseId);
    if (idx >= 0) {
      this.cases[idx] = { ...this.cases[idx], last_message_preview: preview };
      this.applyContactFilter();
    }
  }

  // Eventos/controles del visor
  onImageLoad() { this.imageLoaded = true; }
  onImageError() { this.imageLoaded = true; }

  zoomIn() { this.zoomLevel = Math.min(4, +(this.zoomLevel + 0.2).toFixed(2)); }
  zoomOut() { this.zoomLevel = Math.max(0.4, +(this.zoomLevel - 0.2).toFixed(2)); }

  resetZoom() { this.zoomLevel = 1; }

  toggleFit() {
    this.fitToScreen = !this.fitToScreen;
    if (this.fitToScreen) this.resetZoom();
  }

  // Navegar a la imagen anterior
  prevAttachment() {
    const imgs = this.imageAttachments;
    if (!imgs.length || this.viewingIndex < 0) return;
    this.viewingIndex = (this.viewingIndex - 1 + imgs.length) % imgs.length;
    this.viewingAttachment = imgs[this.viewingIndex];
    // reset visor
    this.imageLoaded = false;
    if (this.fitToScreen) this.zoomLevel = 1;
  }

  // Navegar a la siguiente imagen
  nextAttachment() {
    const imgs = this.imageAttachments;
    if (!imgs.length || this.viewingIndex < 0) return;
    this.viewingIndex = (this.viewingIndex + 1) % imgs.length;
    this.viewingAttachment = imgs[this.viewingIndex];
    // reset visor
    this.imageLoaded = false;
    if (this.fitToScreen) this.zoomLevel = 1;
  }

  // Atajos de teclado (cuando el modal está abierto)
  @HostListener('window:keydown', ['$event'])
  handleKeydown(ev: KeyboardEvent) {
    if (!this.isAttachmentModalOpen) return;

    // cerrar
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.closeAttachmentModal();
      return;
    }

    // zoom
    if (ev.key === '+' || ev.key === '=') {
      ev.preventDefault();
      this.zoomIn();
      return;
    }
    if (ev.key === '-') {
      ev.preventDefault();
      this.zoomOut();
      return;
    }
    if (ev.key === '0') {
      ev.preventDefault();
      this.resetZoom();
      return;
    }

    // ajuste
    if (ev.key.toLowerCase() === 'f') {
      ev.preventDefault();
      this.toggleFit();
      return;
    }

    // navegación (solo imágenes)
    if (this.viewingAttachment?.message_type === 'image') {
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        this.nextAttachment();
        return;
      }
      if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        this.prevAttachment();
        return;
      }
    }
  }

  // Abrir imagen en nueva pestaña (inyecta el <img> para que cargue)
  openImageInNewTab(m: Message) {
    const src = this.attachmentImageSrc(m);
    if (!src) return;

    const w = window.open('', '_blank');
    if (!w) return; // bloqueado por el navegador

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Adjunto</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>
          html,body{height:100%;margin:0;background:#0b0f1a;}
          .wrap{height:100%;display:flex;align-items:center;justify-content:center;}
          img{max-width:95%;max-height:95%;box-shadow:0 10px 30px rgba(0,0,0,.4);border-radius:8px;}
        </style>
      </head>
      <body>
        <div class="wrap">
          <img src="${src}" alt="adjunto"/>
        </div>
      </body>
      </html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback si no hay historial. Puedes poner otra acción si quieres.
      console.debug('No hay historial de navegación para regresar.');
    }
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

  // Buscar clientes (puedes mejorar con debounce si quieres)
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

  // Confirmar asignación del cliente al caso
  async confirmAssignClient() {
    if (!this.selectedCase || !this.selectedClientCandidate) return;

    try {
      this.isAssigningClient = true;
      // // 👉 Llama a tu backend para vincular el cliente
      // // Ejemplo esperado: caseService.assignClient(caseId, clientId)
      await this.chatService.assignCaseToClient(this.selectedCase.case_id, this.selectedClientCandidate.id);

      // // Reflejar en UI (mínimo el nombre)
      this.selectedCase = {
        ...this.selectedCase,
        client_name: this.selectedClientCandidate.full_name
      };

      this.currentClient = this.selectedClientCandidate;

      this.alert.success('Cliente asignado al caso');
      this.closeAssignClientModal();
    } catch (e) {
      this.alert.error('No se pudo asignar el cliente');
    } finally {
      this.isAssigningClient = false;
    }
  }

  openCreateDialog(): void {
    this.currentClient = null;
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.currentClient = this.tmpClient;
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

    const sc = this.selectedCase as CaseWithChannel | null;
    if (!sc) return;

    await this.chatService.assignCaseToClient(sc.case_id, this.currentClient.id);

    const updated: CaseWithChannel = {
      ...sc,                       // ya es CaseWithChannel (no null), no ensancha tipos
      client_name: saved.full_name
    };
    this.selectedCase = updated;

    this.cases = this.cases.map(c =>
      c.case_id === sc.case_id ? { ...c, client_name: saved.full_name } : c
    );
    this.applyContactFilter();

    this.alert.success('Cliente asignado al caso');
  }

  addNewClient(): void {
    this.tmpClient = this.currentClient;
    this.currentClient = null;
    this.isFormOpen = true;
  }

  async loadNotes() {
    if (!this.selectedCase?.case_id) return;

    console.log(this.notes);

    try {
      this.isLoadingNotes = true;
      const res = await this.chatService.getByCase(this.selectedCase.case_id);

      this.notes = Array.isArray(res?.data) ? res.data : [];

    } finally {
      this.isLoadingNotes = false;
    }
  }

  async addNote() {
    const body = (this.newNote || '').trim();
    if (!body || !this.selectedCase?.case_id) return;
    try {
      this.isSavingNote = true;
      const payload: CaseNote = {
        id: null,
        author_id: this.agent_id || 0,
        case_id: this.selectedCase.case_id,
        note: body,
        created_at: null,
      };
      const res = await this.chatService.create(payload);
      if (res?.data) {
        // agrega al inicio (más reciente arriba)
        this.loadNotes();
      }
      this.newNote = '';
    } finally {
      this.isSavingNote = false;
    }
  }

  // Llama loadNotes cuando cambias a modo tarjeta
  set isCaseMode(val: boolean) {
    this._isCaseMode = val;
    if (val) this.loadNotes();
  }
  get isCaseMode(): boolean { return this._isCaseMode; }
  private _isCaseMode = false;


  viewCase() {
    this.loadNotes();
    this.loadCaseItems(); // ✅ nuevo
    this.isCaseMode = true;

  }


  openAssignCampaignModal() {
    this.isAssignCampaignOpen = true;
    this.campaignSearch = '';
    this.selectedCampaignCandidate = null;
    this.loadCampaigns();          // carga inicial
  }

  closeAssignCampaignModal() {
    this.isAssignCampaignOpen = false;
    this.campaignSearch = '';
    this.filteredCampaigns = [];
    this.selectedCampaignCandidate = null;
    this.isLoadingCampaigns = false;
    this.isAssigningCampaign = false;
  }

  private async loadCampaigns(): Promise<void> {
    try {
      this.isLoadingCampaigns = true;

      const res = await this.campaignService.getByCompany(this.authData?.company_id!);
      const data = (res as { data?: unknown })?.data;           // <- narrow local
      const list: CampaignWithFunnel[] = Array.isArray(data) ? data as CampaignWithFunnel[] : [];

      this.campaigns = list;
      this.filteredCampaigns = list;
    } catch {
      this.alert.error('Error cargando campañas');
      this.campaigns = [];
      this.filteredCampaigns = [];
    } finally {
      this.isLoadingCampaigns = false;
    }
  }
  onCampaignSearchChange(q: string) {
    const query = (q || '').trim().toLowerCase();
    if (!query) {
      this.filteredCampaigns = this.campaigns;
      return;
    }
    this.filteredCampaigns = this.campaigns.filter(c =>
      (c.campaign_name || '').toLowerCase().includes(query) ||
      (c.funnel_name || '').toLowerCase().includes(query)
    );
  }

  selectCampaignCandidate(c: CampaignWithFunnel) {
    this.selectedCampaignCandidate = c;
  }

  async confirmAssignCampaign() {
    if (!this.selectedCase || !this.selectedCampaignCandidate) return;

    try {
      this.isAssigningCampaign = true;

      // 👉 Llama a tu backend
      // Debes implementar esto en CaseService si aún no existe:
      // POST /cases/:caseId/campaign/:campaignId   (por ejemplo)

      const payload: AssignCaseToCampaignPayload = {
        case_id: this.selectedCase?.case_id || 0,
        campaign_id: this.selectedCampaignCandidate?.campaign_id || 0,
        ...(this.authData?.user_id ? { changed_by: this.authData.user_id } : {})
      };

      await this.chatService.assignCaseToCampaign(payload);

      // Refleja en UI
      this.currentCampaign = this.selectedCampaignCandidate;

      // Si tu selectedCase trae campaign_name, actualízalo también
      (this.selectedCase as any).campaign_name = this.currentCampaign.campaign_name;

      // Opcional: actualiza en la lista (si la muestras en otro lado)
      this.cases = this.cases.map(c =>
        c.case_id === this.selectedCase!.case_id
          ? { ...c, campaign_name: this.currentCampaign!.campaign_name }
          : c
      );

      this.alert.success('Campaña vinculada al caso');
      this.closeAssignCampaignModal();
    } catch (e) {
      this.alert.error('No se pudo vincular la campaña');
    } finally {
      this.isAssigningCampaign = false;
    }
  }

  async loadCurrentCaseFunnel(caseId: number) {
    try {

      const res = await this.chatService.getCaseFunnelCurrent(caseId);
      this.currentCaseFunnel = res?.data || null;

      console.log(this.currentCaseFunnel);

    } catch {
      this.currentCaseFunnel = null;
    }
  }

  async openHistoryModal() {
    if (!this.selectedCase?.case_id) return;
    this.isHistoryOpen = true;
    await this.loadHistory(this.selectedCase.case_id);
  }

  async loadHistory(caseId: number) {
    try {
      this.isLoadingHistory = true;
      const res = await this.chatService.getCaseFunnelHistory(caseId);
      this.history = Array.isArray(res?.data) ? res.data : [];
    } finally {
      this.isLoadingHistory = false;
    }
  }

  closeHistoryModal() {
    this.isHistoryOpen = false;
  }

  openChangeStatusModal() {
    if (!this.selectedCase?.case_id) return;
    this.loadCurrentCaseFunnel(this.selectedCase.case_id);
    this.isMoveStageOpen = true;

  }

  async openMoveStage() {
    // Asegúrate de tener el estado actual (ya tienes getCaseFunnelCurrent en CaseService)

    this.isMoveStageOpen = true;
  }

  async onMoveStage(payload: MoveCaseStagePayload) {
    // Aquí llamas tu endpoint para mover el stage:
    payload.changed_by = this.authData?.user_id || 0;
    await this.chatService.moveCaseStage(payload);
    // Luego refrescas currentStage e historial


    this.loadCases();
    this.loadCurrentCaseFunnel(this.selectedCase!.case_id);

    this.isMoveStageOpen = false;


  }

  async loadCurrentStage(case_id: number) {
    const res = await this.chatService.getCaseFunnelCurrent(case_id);
    this.currentStage = res.data || null;

  }

  openCloseCaseModal() {
    this.isCloseCaseOpen = true;
    this.closeNote = '';
  }

  closeCloseCaseModal() {
    this.isCloseCaseOpen = false;
  }

  async confirmCloseCase() {
    if (!this.selectedCase) return;

    try {
      this.isClosingCase = true;
      const res = await this.chatService.closeCase(this.selectedCase.case_id,
        this.closeNote,
        this.authData?.user_id || 0,
        this.selectedCase.funnel_id || 0);

      if (res.success) {
        this.alert.success('Caso cerrado correctamente');
        this.selectedCase.status = 'closed';
        this.isCaseMode = false;
        this.loadCases();
        this.selectedCase = null;

        this.closeCloseCaseModal();
      } else {
        this.alert.error(res.message || 'No se pudo cerrar el caso');
      }
    } catch (err) {
      console.error(err);
      this.alert.error('Error al cerrar el caso');
    } finally {
      this.isClosingCase = false;
    }
  }

  async loadCaseItems() {
    if (!this.selectedCase?.case_id) return;
    try {
      this.isLoadingCaseItems = true;
      const res = await this.caseItemService.getByCaseId(this.selectedCase.case_id);
      this.caseItems = Array.isArray(res?.data) ? res.data : [];
    } catch {
      this.alert.error('Error cargando artículos del caso');
    } finally {
      this.isLoadingCaseItems = false;
    }
  }




  editItem(i: VwCaseItemsDetail) {
    this.itemForm = {
      id: i.case_item_id,
      case_id: i.case_id,
      item_id: i.item_id,
      price: i.price,
      quantity: i.quantity,
      notes: i.notes || '',
      acquired: i.acquired,
    };
    this.editingItem = i;
    this.isItemModalOpen = true;
  }

  closeItemModal() {
    this.isItemModalOpen = false;
    this.editingItem = null;
  }

  async saveItem() {
    try {
      const payload = { ...this.itemForm };
      if (!this.selectedCase) return;
      payload.case_id = this.selectedCase.case_id;

      if (this.editingItem) {
        payload.id = this.editingItem.case_item_id;
        await this.caseItemService.update(payload);
        this.alert.success('Artículo actualizado');
      } else {
        await this.caseItemService.create(payload);
        this.alert.success('Artículo agregado');
      }

      this.closeItemModal();
      await this.loadCaseItems();
    } catch {
      this.alert.error('No se pudo guardar el artículo');
    }
  }

  async deleteItem(id: number) {
    if (!confirm('¿Deseas eliminar este artículo?')) return;
    try {
      await this.caseItemService.delete(id);
      this.alert.success('Artículo eliminado');
      await this.loadCaseItems();
    } catch {
      this.alert.error('Error al eliminar el artículo');
    }
  }

  // Cargar artículos por compañía al abrir modal
  async openAddItemModal() {
    if (!this.selectedCase) return;

    this.itemForm = {
      id: null,
      case_id: this.selectedCase.case_id,
      item_id: 0,
      price: 0,
      quantity: 1,
      notes: '',
      acquired: false,
    };
    this.total = 0;
    this.isItemModalOpen = true;

    const companyId = this.selectedCase.company_id;
    // 🔹 carga artículos de la compañía
    const res = await this.itemService.getByCompany(companyId!);
    this.itemsList = res.success ? res.data : [];
  }

  // Evento al seleccionar un artículo
  onItemSelected() {
    const selected = this.itemsList.find(it => it.id === this.itemForm.item_id);
    if (selected) {
      this.itemForm.price = selected.item_price ?? 0; // Usa el precio del item o 0 si no existe
    }
    this.updateTotal();
  }
  // Actualiza el total automáticamente
  updateTotal() {
    this.total = (this.itemForm.price || 0) * (this.itemForm.quantity || 0);
  }

  openDeleteModal(id: number) {
    this.itemToDelete = id;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.itemToDelete = null;
  }

  async confirmDeleteItem() {
    if (!this.itemToDelete) return;

    try {
      await this.caseItemService.delete(this.itemToDelete);
      this.alert.success('Artículo eliminado');
      await this.loadCaseItems();
    } catch {
      this.alert.error('Error al eliminar el artículo');
    } finally {
      this.closeDeleteModal();
    }
  }

  parseUrls(text: string): string {
    if (!text) return '';

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, url => {
      // Escapa comillas para evitar errores HTML
      const safeUrl = url.replace(/"/g, '&quot;');
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer"
              class="text-[#3e66ea] hover:underline break-words">${url}</a>`;
    });
  }
}