import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { buildAgentTextMessage, buildAgentImageMessage, AgentMessage, buildAgentFileMessage, buildAgentAudioMessage } from '@app/models/agent-message.model';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { Client } from '@app/models/client.model';
import { Message } from '@app/models/message.model';
import { AssignCaseToCampaignPayload, CaseFunnelCurrent, CaseFunnelEntry, CaseService, VwCaseCurrentStage } from '@app/services/case.service';
import { ClientService } from '@app/services/client.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { WSMessage, WsService } from '@app/services/extras/ws.service';
import { last, Subscription } from 'rxjs';
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
import { Department } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';
import { User as UserAuthModel } from '../../models/auth.model' //'../../../models/auth.model';
import { CompanyChannelTemplateView } from '@app/models/company-channel-template-view.model';
import { ChannelService } from '@app/services/channel.service';
import { ChannelWhatsAppTemplate } from '@app/models/channel-whatsapp-template.model';
import { CampaignWhatsappPushRequest } from '@app/models/campaign-whatsapp-push.model';
import { CampaignPushService } from '@app/services/campaign-push.service';
import { SendImageModalComponent } from './send-image-modal/send-image-modal.component';
import { CompanyService } from '@app/services/company.service';
import { AgentDepartmentInformation } from '@app/models/agent-department-information.model';
import { VWChannelIntegration } from '@app/models/vw-channel-integration.model';
import { SendFileModalComponent } from './send-file-modal/send-file-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AudioRecorderComponent } from './send-audio-modal/audio-recorder.component';

type MessageUI = Message & {
  _justArrived?: boolean;
};

@Component({
  selector: 'app-chat-workspace',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ClientFormComponent,
    MoveStageModalComponent,
    SendImageModalComponent,
    SendFileModalComponent,
    AudioRecorderComponent

  ],
  templateUrl: './chat-workspace.component.html',
  styleUrls: ['./chat-workspace.component.css']
})
export class ChatWorkspaceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() preSelectedCase: CaseWithChannel | null = null;
  @Output() close = new EventEmitter<void>();

  currentAttachmentType: 'image' | 'audio' | 'pdf' | 'file' | null = null;
  currentAttachmentSrc: string | null = null;
  currentAttachmentName: string | null = null;

  currentCaseFunnel: VwCaseCurrentStage | null = null;

  isCloseCaseOpen = false;
  closeNote = '';
  isClosingCase = false;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;



  showTemplateMenu = false;

  private wsAgentSub?: Subscription;

  // En tu componente padre
  isMoveStageOpen = false;
  currentStage: VwCaseCurrentStage | null = null;

  templateLoading = false;


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


  // ======== Estado del modal de departamento ========
  isAssignDepartmentOpen = false;
  departmentSearch = '';
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  selectedDepartmentCandidate: Department | null = null;
  isLoadingDepartments = false;
  isAssigningDepartment = false;

  selectedDepartment: Department | null = null;

  stateUser: UserAuthModel | null = null;

  selectedTemplate: number | null = null;
  selectedTemplateObj: ChannelWhatsAppTemplate | null = null;
  templates: ChannelWhatsAppTemplate[] = [];

  // 

  isImageModalOpen = false;

  openImageModal() {
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
  }

  isNewConversationOpen = false;
  newConvPhone = '';
  newConvClientSearch = '';



  newConvSelectedClient: Client | null = null;
  newConvClientResults: Client[] = [];

  newConvSelectedTemplate: ChannelWhatsAppTemplate | null = null;

  selectedShowDepartmentId: number | null = null;

  agents: AgentDepartmentInformation[] = [];
  showDepartments: Department[] = [];

  integrations: VWChannelIntegration[] = [];
  selectedIntegration: VWChannelIntegration | null = null;


  isFileModalOpen = false;
  startInAudioMode = false;


  isAudioModalOpen = false;


  uiMessage: string | null = null;
  uiMessageType: 'error' | 'success' | 'info' = 'info';

  canSendMessages = true;
  sendDisabledReason: string | null = null;

  showMessage(msg: string, type: 'error' | 'success' | 'info' = 'info') {
    this.uiMessage = msg;
    this.uiMessageType = type;
  }

  closeMessage() {
    this.uiMessage = null;
  }

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
    private departmentService: DepartmentService,
    private channelService: ChannelService,
    private pushService: CampaignPushService,
    private companyService: CompanyService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef


  ) { }

  ngOnInit(): void {
    this.onInit();

    // Si viene desde un modal externo
    // if (this.preSelectedCase) {
    //   setTimeout(() => this.selectCase(this.preSelectedCase!), 100);
    // }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.wsAgentSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preSelectedCase']?.currentValue) {
      const c = changes['preSelectedCase'].currentValue as CaseWithChannel;

      if (this.selectedCase?.case_id === c.case_id) return;

      console.log('🔥 Caso recibido por Input:', c.case_id);

      this.selectCase(c);

      // 🔥 FUERZA REDIBUJO CON ONPUSH
      this.cdr.markForCheck();
    }
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
    this.stateUser = this.authService.getCurrentUser();

    this.authData = this.authService.getStoredAuthData();

    this.agent_id = this.stateUser?.user_id || null;

    console.log('Agent ID:', this.agent_id);

    if (!this.agent_id) return;


    await this.loadCompanies();


    await this.loadCases();

    // WS GLOBAL PARA NOTIFICAR NUEVOS MENSAJES EN CUALQUIER CASO
    this.wsAgentSub = this.ws.connect(`${environment.socket_url}/ws?agent_id=${this.agent_id}`)
      .subscribe((evt: WSMessage) => {

        if (evt.type !== 'new_message') return;

        const caseId = evt.case_id;

        // Si estoy dentro del caso → NO incrementa
        if (this.selectedCase && this.selectedCase.case_id === caseId) return;

        // Buscar caso
        const idx = this.cases.findIndex(c => c.case_id === caseId);
        if (idx < 0) return;

        const updated = [...this.cases];
        updated[idx] = {
          ...updated[idx],
          unread_count: (updated[idx].unread_count || 0) + 1,
          last_message_preview: evt.data?.text_content || '[Mensaje]'
        };

        this.cases = updated;
        this.applyContactFilter();
      });

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
        unread_count: Number(c.unread_count ?? 0),
        last_message_preview: c.last_message_preview ?? '',
        last_message_at: c.last_message_at ?? null,
      }));

      // Order by last_message_at descending
      this.cases.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      console.log('Casos cargados:', this.cases);

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

    this.filteredCases = this.cases.filter(c => {
      const name = (c.client_name || '').toLowerCase();
      const integration = (c.integration_name || '').toLowerCase();
      const sender = String(c.sender_id || '').toLowerCase();
      const caseId = String(c.case_id || '').toLowerCase();

      return (
        !q ||
        name.includes(q) ||
        caseId.includes(q) ||
        sender.includes(q) ||
        integration.includes(q)  // opcional pero útil
      );
    });
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
    // cerrar WS previo
    this.ws.disconnect();
    this.wsSub?.unsubscribe();

    this.selectedCase = null;
    this.messages = [];
    this.isLoadingMessages = true;

    try {
      // 🔹 1. SOLO mensajes
      const result = await this.chatService.getMessagesByCase(c.case_id);
      this.messages = Array.isArray(result?.data) ? result.data : [];
      this.selectedCase = c;

      // 🔹 2. marcar como leído SOLO si aplica
      if (c.unread_count > 0) {
        this.chatService.markMessagesAsRead(c.case_id);
        this.updateCaseUnreadCount(c.case_id, 0);
      }

      // 🔹 3. WS por caso
      const url = `${environment.socket_url}/ws?case_id=${c.case_id}`;
      this.wsSub = this.ws.connect(url).subscribe(evt => {
        this.onWsMessage(evt);
      });

    } finally {
      this.isLoadingMessages = false;
      this.cdr.markForCheck();
    }
  }

  private onWsMessage(evt: WSMessage) {
    if (!this.selectedCase) return;
    if (evt.case_id !== this.selectedCase.case_id) return;

    if (evt.type !== 'new_message') return;

    this.handleNewMessage(evt);
  }


  private handleNewMessage(evt: WSMessage) {
    const fallback: MessageUI = {
      id: 0,
      case_id: this.selectedCase!.case_id,
      sender_type: 'client',
      message_type: 'text',
      text_content: '',
      file_url: null,
      mime_type: null,
      channel_message_id: '',
      created_at: new Date().toISOString(),
      base64_content: null,
      has_error: false,
      message_error: null
    };

    let real = this.normalizeApiMessage(evt.data, fallback) as MessageUI;

    // animación
    real._justArrived = true;
    setTimeout(() => real._justArrived = false, 300);

    // reemplazo optimista
    const tmpId = (evt.data as any)?.client_tmp_id;
    if (tmpId) {
      const idx = this.messages.findIndex(m => m.channel_message_id === tmpId);
      if (idx >= 0) {
        const copy = [...this.messages];
        copy[idx] = real;
        this.messages = copy;
        this.updatePreview(evt.case_id, real);
        this.scrollToBottomSoon();
        return;
      }
    }

    // evitar duplicados
    const isDuplicate = this.messages.some(m =>
      (real.id && m.id === real.id) ||
      (!!real.channel_message_id && m.channel_message_id === real.channel_message_id)
    );

    if (!isDuplicate) {
      this.messages = [...this.messages, real];
    }

    this.updatePreview(evt.case_id, real);
    this.scrollToBottomSoon();
  }

  // async selectCase(c: CaseWithChannel) {
  //   // Cierra WS previo
  //   this.ws.disconnect();
  //   this.wsSub?.unsubscribe();

  //   this.selectedCase = null;
  //   this.messages = [];
  //   this.isLoadingMessages = true;

  //   try {
  //     // 1) Histórico
  //     const result = await this.chatService.getMessagesByCase(c.case_id);
  //     this.messages = Array.isArray(result?.data) ? result.data : [];
  //     this.selectedCase = c;

  //     // Aquí se debe verificar si se venció la ventana de tiempo.


  //     // Cargar campaña actual del funnel
  //     this.campaignService.getById(c.campaign_id || 0).then(res => {
  //       this.currentCampaign = res?.data || null;
  //     });

  //     await this.loadCurrentCaseFunnel(c.case_id);

  //     this.loadDepartment();


  //     await this.loadCurrentStage(c.case_id); // Nueva línea para cargar el estado actual


  //     // if (this.selectedCase.manual_starting_lead && this.selectedCase.client_messages == 0) {
  //     //   this.loadTemplatesForChannelIntegration();
  //     // }
  //     this.loadTemplates();

  //     if (c.client_id) {
  //       const clientResponse = await this.clientService.getById(c.client_id);

  //       if (clientResponse.success) {
  //         this.currentClient = clientResponse.data || null;
  //       } else {
  //         this.currentClient = null;
  //       }
  //     }

  //     // 2) Conexión WS por caso
  //     // let wsBase = environment.API.BASE
  //     //   .replace('http', 'ws')
  //     //   .replace('/api', '')
  //     //   .replace('https', 'wss');
  //     let wsBase = environment.socket_url;

  //     const url = `${wsBase}/ws?case_id=${c.case_id}`;
  //     console.log('Conectando a WebSocket en:', url);

  //     this.wsSub = this.ws.connect(url).subscribe((evt: WSMessage) => {
  //       if (!this.selectedCase || evt.case_id !== this.selectedCase.case_id) return;

  //       if (evt.type === 'new_message') {
  //         const fallback: MessageUI = {
  //           id: 0,
  //           case_id: this.selectedCase.case_id,
  //           sender_type: 'client',
  //           message_type: 'text',
  //           text_content: '',
  //           file_url: null,
  //           mime_type: null,
  //           channel_message_id: '',
  //           created_at: new Date().toISOString(),
  //           base64_content: null,
  //           has_error: false,
  //           message_error: null
  //         };

  //         let real = this.normalizeApiMessage(evt.data, fallback) as MessageUI;

  //         // ⭐ Marcar como recién llegado (para animación)
  //         real._justArrived = true;
  //         setTimeout(() => real._justArrived = false, 300);

  //         // 🔄 Si trae client_tmp_id reemplaza mensaje optimista
  //         const tmpId = (evt.data as any)?.client_tmp_id;
  //         if (tmpId) {
  //           const idx = this.messages.findIndex(m => m.channel_message_id === tmpId);
  //           if (idx >= 0) {
  //             const copy = [...this.messages];
  //             copy[idx] = { ...real, channel_message_id: real.channel_message_id || tmpId };
  //             this.messages = copy;
  //             this.updatePreview(evt.case_id, real);
  //             this.scrollToBottomSoon();
  //             return;
  //           }
  //         }

  //         // 🔍 Buscar por fuzzy match (cuando no hay tmp_id)
  //         const fuzzyIdx = this.messages.findIndex(m =>
  //           m.id === 0 &&
  //           m.sender_type === 'agent' &&
  //           m.message_type === real.message_type &&
  //           (m.text_content || '').trim() === (real.text_content || '').trim()
  //         );

  //         if (fuzzyIdx >= 0) {
  //           const copy = [...this.messages];
  //           copy[fuzzyIdx] = real;
  //           this.messages = copy;
  //         } else {
  //           // No duplicados
  //           const dup = this.messages.some(m =>
  //             (real.id && m.id === real.id) ||
  //             (!!real.channel_message_id && m.channel_message_id === real.channel_message_id)
  //           );
  //           if (!dup) this.messages = [...this.messages, real];
  //         }


  //         this.updatePreview(evt.case_id, real);
  //         this.scrollToBottomSoon();

  //         // Reset de mensajes no leídos del caso seleccionado
  //         c.unread_count = 0;
  //         this.updateCaseUnreadCount(c.case_id, 0);

  //         // Marcar mensajes como leídos en backend

  //         if (c.unread_count > 0) {
  //           this.chatService.markMessagesAsRead(c.case_id).then(() => {
  //             console.log("Marcar como leídos");

  //           }).catch(() => {

  //             console.log("Error al marcar como leídos");

  //           });
  //         }

  //       }
  //     });

  //   } finally {
  //     c.unread_count = 0;
  //     this.updateCaseUnreadCount(c.case_id, 0);

  //     if (c.unread_count > 0) {
  //       this.chatService.markMessagesAsRead(c.case_id).then(() => {
  //         console.log("Marcar como leídos");

  //       }).catch(() => {

  //         console.log("Error al marcar como leídos");

  //       });
  //     }


  //     this.isLoadingMessages = false;
  //     this.cdr.markForCheck();


  //   }
  // }

  loadDepartment() {
    if (!this.selectedCase?.department_id) return;

    this.departmentService.getById(this.selectedCase.department_id).then(res => {
      this.selectedDepartment = res.data || null;
    }).catch(err => {
      this.selectedDepartment = null;
      this.alert.error(this.t('chat.failed_to_load_department'));
    });
  }

  updateCaseUnreadCount(caseId: number, value: number) {
    const idx = this.cases.findIndex(x => x.case_id === caseId);
    if (idx >= 0) {
      const updated = [...this.cases];
      updated[idx] = {
        ...updated[idx],
        unread_count: value
      };
      this.cases = updated;
      this.applyContactFilter();
    }
  }

  async loadClientIfNeeded() {
    if (!this.selectedCase?.client_id || this.currentClient) return;

    const res = await this.clientService.getById(this.selectedCase.client_id);
    this.currentClient = res.success ? res.data : null;
  }


  openAssignDepartmentModal() {
    this.isAssignDepartmentOpen = true;
    this.departmentSearch = '';
    this.selectedDepartmentCandidate = null;
    this.loadDepartments();

  }

  private async loadDepartments(): Promise<void> {
    try {
      this.isLoadingDepartments = true;
      const res = await this.departmentService.getByCompany(this.selectedCase?.company_id || 0);
      const data = (res as { data?: unknown })?.data;
      const list: Department[] = Array.isArray(data) ? data as Department[] : [];

      this.departments = list;
      this.filteredDepartments = list;
    } catch {
      this.alert.error('Error cargando departamentos');
      this.departments = [];
      this.filteredDepartments = [];
    } finally {
      this.isLoadingDepartments = false;
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

  // openAttachment(m: Message) {
  //   this.viewingAttachment = m;
  //   this.isAttachmentModalOpen = true;

  //   // reset estado del visor
  //   this.imageLoaded = false;
  //   this.zoomLevel = 1;
  //   this.fitToScreen = true;

  //   // si es imagen, establecer índice para navegación
  //   if (m.message_type === 'image') {
  //     const imgs = this.imageAttachments;
  //     const idx = imgs.findIndex(x =>
  //       (x.id && m.id && x.id === m.id) ||
  //       (!!x.channel_message_id && !!m.channel_message_id && x.channel_message_id === m.channel_message_id) ||
  //       (x.created_at === m.created_at && x.message_type === m.message_type)
  //     );
  //     this.viewingIndex = idx;
  //   } else {
  //     this.viewingIndex = -1;
  //   }
  // }

  openAttachment(m: Message) {
    this.viewingAttachment = m;
    this.isAttachmentModalOpen = true;

    // reset del visor
    this.imageLoaded = false;
    this.zoomLevel = 1;
    this.fitToScreen = true;

    const mime = (m.mime_type || '').toLowerCase();
    const src = m.file_url || m.base64_content || null;

    if (!src) {
      console.warn("No se puede abrir el adjunto: sin contenido");
      return;
    }

    // =========================================
    //  🖼 IMÁGENES
    // =========================================
    if (mime.startsWith("image/")) {
      const imgs = this.imageAttachments;

      const idx = imgs.findIndex(x =>
        (x.id && m.id && x.id === m.id) ||
        (!!x.channel_message_id && !!m.channel_message_id && x.channel_message_id === m.channel_message_id) ||
        (x.created_at === m.created_at && x.message_type === m.message_type)
      );

      this.viewingIndex = idx;
      this.currentAttachmentType = "image";
      this.currentAttachmentSrc = src;
      return;
    }

    // =========================================
    // 🔊 AUDIO
    // =========================================
    if (mime.startsWith("audio/")) {
      this.currentAttachmentType = "audio";
      this.currentAttachmentSrc = src;
      this.viewingIndex = -1;
      return;
    }

    // =========================================
    // 📕 PDF
    // =========================================
    if (mime.includes("pdf")) {
      this.currentAttachmentType = "pdf";

      // si es base64, lo usamos directo
      if (src.startsWith("data:")) {
        this.currentAttachmentSrc = src;
      } else {
        // si es URL directa, usamos visor
        this.currentAttachmentSrc =
          `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`;
      }

      this.viewingIndex = -1;
      return;
    }

    // =========================================
    // 📘 DOC, DOCX — 📗 XLS, XLSX — 🗜 ZIP — TXT…
    // =========================================
    this.currentAttachmentType = "file";
    this.currentAttachmentSrc = src;
    this.currentAttachmentName = m.text_content || "archivo";
    this.viewingIndex = -1;
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
      has_error: api.has_error ?? false,
      message_error: api.message_error ?? null
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


  // viewCase() {
  //   this.loadNotes();
  //   this.loadCaseItems(); // ✅ nuevo
  //   this.isCaseMode = true;

  // }

  viewCase() {
    if (!this.notes.length) {
      this.loadNotes();
    }

    if (!this.caseItems.length) {
      this.loadCaseItems();
    }

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

  onDepartmentSearchChange(q: string) {
    const query = (q || '').trim().toLowerCase();
    if (!query) {
      this.filteredDepartments = this.departments;
      return;
    }
    this.filteredDepartments = this.departments.filter(d =>
      (d.description || '').toLowerCase().includes(query)
    );
  }

  selectDepartmentCandidate(dep: Department) {
    this.selectedDepartmentCandidate = dep;
  }

  async confirmAssignDepartment() {
    if (!this.selectCase || !this.selectedDepartmentCandidate) return;

    try {
      this.isAssigningDepartment = true;

      // TODO: implementar en tu CaseService
      await this.chatService.assignCaseToDepartment({
        case_id: this.selectedCase?.case_id ?? 0,  // 👈 valor por defecto 0
        department_id: this.selectedDepartmentCandidate.id,
        changed_by: this.stateUser?.user_id ?? 0,
      });

      // Actualizar en UI
      this.selectedDepartment = this.selectedDepartmentCandidate;

      this.alert.success('Departamento asignado al caso');
      this.closeAssignDepartmentModal();
    } catch (e) {
      this.alert.error('No se pudo asignar el departamento');
    } finally {
      this.isAssigningDepartment = false;
    }
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


  closeAssignDepartmentModal() {
    this.isAssignDepartmentOpen = false;
    this.departmentSearch = '';
    this.filteredDepartments = [];
    this.selectedDepartmentCandidate = null;
    this.isLoadingDepartments = false;
    this.isAssigningDepartment = false;
  }

  toggleTemplateMenu() {
    this.showTemplateMenu = !this.showTemplateMenu;

    if (this.showTemplateMenu && !this.templates.length) {
      this.loadTemplates();
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


  loadTemplatesForChannelIntegration() {
    this.templateLoading = true;
    this.templates = [];
    this.channelService.getWhatsappTemplatesByIntegration(this.selectedCase?.channel_integration_id || 0)
      .then(resp => {
        // filtra solo los que tengan template_id
        let data = resp?.data || [];

        this.templates = (resp?.data || []).filter(t => t.id);
      })
      .catch(err => console.error('Error loading templates:', err))
      .finally(() => this.templateLoading = false);
  }

  loadTemplates() {
    this.templateLoading = true;
    this.templates = [];
    this.channelService.getWhatsappTemplatesByDepartmentId(this.selectedCase?.department_id || 0)
      .then(resp => {
        // filtra solo los que tengan template_id

        this.templates = (resp?.data || []).filter(t => t.id);

        console.log(this.templates);

      })
      .catch(err => console.error('Error loading templates:', err))
      .finally(() => this.templateLoading = false);
  }

  async sendTemplate() {

    this.sendPush();

  }



  async sendPush() {


    let leads = [
      {
        phone_number: this.selectedCase?.sender_id || '',
        full_name: this.currentClient?.full_name || undefined,
        manual_starting_lead: true,
        client_id: this.currentClient?.id || undefined,
        case_id: this.selectedCase?.case_id || undefined,

      }
    ];

    const payload: CampaignWhatsappPushRequest = {
      campaign_id: this.selectedCase?.campaign_id || 0,
      description: "Push desde caso #" + this.selectedCase?.case_id,
      template_id: this.selectedTemplate!,
      department_id: this.selectedDepartment?.id || 0,
      channel_integration_id: this.selectedIntegration?.channel_integration_id || 0,
      changed_by: this.agent_id || 0, // ajusta al campo que uses como user_id
      leads: leads,
    };


    try {
      const resp = await this.pushService.createWhatsappPush(payload);
      if (resp?.success) {

        if (this.selectedCase) {
          this.selectedCase.client_messages = 1;

        }

        // Si tienes la lista de casos cargada, actualiza ahí también
        this.cases = this.cases.map(c =>
          c.case_id === this.selectedCase?.case_id
            ? { ...c, client_messages: 1 }
            : c
        );


        this.alert.success(`Push creado (ID: ${resp.data?.push_id ?? '—'})`);

      } else {
        this.alert.error(resp?.message || 'No se pudo registrar el push.');
      }
    } catch (e) {
      console.error(e);
      this.alert.error('Error al registrar el push.');
    } finally {

    }
  }

  sendSelectedTemplate(t: ChannelWhatsAppTemplate) {

    this.selectedTemplate = t.id;

    this.selectedTemplateObj = t;


    this.toggleTemplateMenu();

    this.sendIndividualTemplate();

  }

  async sendIndividualTemplate() {
    if (!this.selectedTemplate) return;
    try {
      try {


        const resp = await this.pushService.sendWhatsappTemplateMessage(
          this.selectedTemplate,
          this.selectedCase?.case_id || 0,

        );

        if (resp?.success) {

          // this.draft = 'Template ' + (this.selectedTemplateObj?.template_name || '') + ' enviado.';

          // this.send();

          if (this.selectedCase) {
            this.selectedCase.client_messages = 1;
          }

          // Si tienes la lista de casos cargada, actualiza ahí también
          this.cases = this.cases.map(c =>
            c.case_id === this.selectedCase?.case_id
              ? { ...c, client_messages: 1 }
              : c
          );


          this.alert.success(`Push creado (ID: ${resp.data?.message ?? '—'})`);

        } else {
          this.alert.error(resp?.message || 'No se pudo registrar el push.');
        }
      } catch (e) {
        console.error(e);
        this.alert.error('Error al registrar el push.');
      } finally {

      }
    } catch (err) {
      console.error('❌ Error al enviar template:', err);
      this.alert.error(this.t('chat.failed_to_send'));
    }
  }

  async send() {
    const body = this.draft.trim();
    if (!body || !this.selectedCase) return;

    const clientTmpId = `tmp-${Date.now()}-${this.tmpCounter++}`;

    const optimistic: MessageUI = {
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
      _justArrived: true
    };

    setTimeout(() => optimistic._justArrived = false, 300);

    this.messages = [...this.messages, optimistic];
    this.draft = '';
    this.scrollToBottomSoon();

    try {
      const payload = buildAgentTextMessage(this.selectedCase.case_id, body);
      (payload as any).client_tmp_id = clientTmpId;

      await this.chatService.sendMessage(payload);
    } catch (err) {
      console.error('❌ Error al enviar mensaje:', err);
      this.alert.error(this.t('chat.failed_to_send'));
      this.messages = this.messages.filter(m => m.channel_message_id !== clientTmpId);
    }
  }

  // Cuando el usuario confirma envío
  async onImageSend(event: { base64: string; description: string }) {
    if (!this.selectedCase) return;

    const clientTmpId = `tmp-img-${Date.now()}`;
    const optimistic: Message = {
      id: 0,
      case_id: this.selectedCase.case_id,
      sender_type: 'agent',
      message_type: 'image',
      text_content: event.description,
      file_url: null,
      mime_type: 'image/jpeg',
      channel_message_id: clientTmpId,
      created_at: new Date().toISOString(),
      base64_content: event.base64,
    };

    console.log(event.base64);


    this.messages = [...this.messages, optimistic];
    this.scrollToBottomSoon();

    try {

      const payload = buildAgentImageMessage(this.selectedCase.case_id, event.description, event.base64);
      (payload as any).client_tmp_id = clientTmpId;

      await this.chatService.sendMessage(payload);
      this.alert.success('Imagen enviada correctamente');
    } catch {
      this.alert.error('Error al enviar imagen');
    } finally {
      this.closeImageModal();
    }
  }

  openNewConversationModal() {
    this.isNewConversationOpen = true;

    // limpia los campos del modal
    this.newConvPhone = '';
    this.newConvSelectedClient = null;
    this.newConvSelectedTemplate = null;


  }

  async searchNewConvClient() {
    const q = this.newConvClientSearch.trim();
    if (!q) {
      this.newConvClientResults = [];
      return;
    }

    const res = await this.clientService.getAll();

    // 🔥 TIPADO CORRECTO
    const list: Client[] = Array.isArray(res?.data)
      ? (res.data as Client[])
      : [];

    this.newConvClientResults = list.filter((c: Client) =>
      (c.full_name || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q.toLowerCase())
    );
  }

  selectNewConvClient(c: Client) {
    this.newConvSelectedClient = c;
    this.newConvPhone = c.phone || '';
  }

  async confirmNewConversation() {
    try {

      const phone = (this.newConvPhone || '').trim();

      // 🔴 Validaciones duras

      if (phone.includes(' ')) {
        this.showMessage('El número no debe contener espacios', 'error');

        return;
      }
      if (!phone) {

        this.showMessage('Debe ingresar un número de teléfono', 'error');
        return;
      }

      if (phone.includes(' ')) {
        this.showMessage('El número no debe contener espacios', 'error');

        return;
      }

      if (phone.length < 11) {
        this.showMessage('El número es demasiado corto', 'error');
        return;
      }

      // opcional: solo números
      if (!/^\d+$/.test(phone)) {
        this.showMessage('El número solo puede contener dígitos', 'error');

        return;
      }

      // ✔️ normalizado
      this.newConvPhone = phone;

      if (!this.newConvSelectedTemplate) {
        this.alert.error("Debe seleccionar un template");
        return;
      }

      if (!this.selectedIntegration) {
        this.alert.error("Debe seleccionar una integración de WhatsApp");
        return;
      }

      // teléfono: cliente seleccionado o ingresado
      const contactPhone =
        this.newConvSelectedClient?.phone || this.newConvPhone?.trim();

      if (!contactPhone) {
        this.alert.error("Debe ingresar o seleccionar un teléfono");
        return;
      }

      const payload = {
        template_id: this.newConvSelectedTemplate.id,
        channel_integration_id: this.selectedIntegration,
        contact_phone: contactPhone.startsWith("+")
          ? contactPhone.replace("+", "")
          : contactPhone,
        agent_id: this.agent_id,          // ← lo tienes disponible en el component
        client_id: this.newConvSelectedClient?.id || null
      };

      console.log("🚀 Enviando payload:", payload);

      const res = await this.chatService.sendTemplateMessage(payload);

      if (res.success) {
        this.alert.success("Mensaje enviado correctamente");
        this.isNewConversationOpen = false;

        console.log(res.data.case_id);


        await this.loadCases();

        const newCaseId = res.data?.case_id;

        const createdCase = this.cases.find(c => c.case_id === newCaseId);

        if (createdCase) {
          // marcar highlight temporal
          createdCase._highlight = true;

          this.selectCase(createdCase);

          // quitar highlight después de 2 segundos
          setTimeout(() => {
            createdCase._highlight = false;
          }, 2000);
        } else {
          console.warn("⚠ No se encontró el caso recién creado en la lista.");
        }


      } else {
        this.alert.error("No se pudo enviar el mensaje");
      }
    } catch (e) {
      console.error(e);
      this.alert.error("Error al iniciar la conversación");
    }
  }


  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.agent_id || 0);
      if (response?.success && response.data?.length) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0].company_id;

        await this.loadDepartmentsForDisplay();

      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async loadDepartmentsForDisplay(): Promise<void> {
    if (!this.selectedCompanyId) return;

    try {
      const res = await this.departmentService.getByCompanyAndUser(
        this.selectedCompanyId,
        this.agent_id || 0
      );

      this.showDepartments = res.success && res.data ? res.data : [];
      this.selectedShowDepartmentId = this.showDepartments[0]?.id || null;

      // ⬇️ ESTE ES EL FIX
      if (this.selectedShowDepartmentId) {
        this.onShowDepartmentSelected();  // <-- DISPARA LA CARGA
      }

    } catch (err) {
      console.error('Error loading departments for display', err);
    }
  }


  onShowDepartmentSelected(): void {
    // this.loadDashboardStats();
    // this.loadUnassignedCases();

    this.loadTemplatesNewChat();
    this.loadIntegrationsForDepartment(this.selectedShowDepartmentId!);

  }


  async onCompanyChange(): Promise<void> {
    await this.loadDepartmentsForDisplay();

  }


  loadIntegrationsForDepartment(departmentId: number) {
    this.channelService.getWhatsappIntegrationsByDepartment(departmentId)
      .then(resp => this.integrations = resp?.data || [])
      .catch(err => console.error('Error loading WhatsApp integrations:', err));
  }


  loadTemplatesNewChat() {
    this.templateLoading = true;
    this.templates = [];
    this.channelService.getWhatsappTemplatesByDepartmentId(this.selectedShowDepartmentId || 0)
      .then(resp => {
        // filtra solo los que tengan template_id

        this.templates = (resp?.data || []).filter(t => t.id);

        console.log(this.templates);

      })
      .catch(err => console.error('Error loading templates:', err))
      .finally(() => this.templateLoading = false);
  }

  clearNewConvClient() {
    this.newConvSelectedClient = null;
    this.newConvClientSearch = '';
    this.newConvClientResults = [];
  }

  trackByClientId(index: number, item: Client): number {
    return item.id;
  }

  get selectedClient(): Client | null {
    return this.newConvSelectedClient;
  }


  openFilePicker() {
    console.log("Abrir selector de archivos");
    this.isFileModalOpen = true;
  }


  closeFileModal() {
    this.isFileModalOpen = false;
    this.startInAudioMode = false; // limpiar para la próxima
  }


  async onFileSend(event: { base64: string; filename: string, mime: string }) {
    if (!this.selectedCase) return;

    const clientTmpId = `tmp-file-${Date.now()}`;

    // Detectar MIME desde base64

    if (event.base64.startsWith("data:")) {
      const parts = event.base64.split(";")[0];
    }

    const optimistic: Message = {
      id: 0,
      case_id: this.selectedCase.case_id,
      sender_type: 'agent',
      message_type: 'file',
      text_content: event.filename,  // el nombre del archivo
      file_url: null,
      mime_type: event.mime,
      channel_message_id: clientTmpId,
      created_at: new Date().toISOString(),
      base64_content: event.base64,
    };

    // Se agrega optimista al chat
    this.messages = [...this.messages, optimistic];
    this.scrollToBottomSoon();

    try {
      const payload = buildAgentFileMessage(
        this.selectedCase.case_id,
        event.filename,
        event.base64,
        event.mime
      );

      (payload as any).client_tmp_id = clientTmpId;

      await this.chatService.sendMessage(payload);

      this.alert.success('Archivo enviado correctamente');
    } catch (err) {
      console.error("❌ Error al enviar archivo", err);
      this.alert.error("Error al enviar archivo");
      // remover optimista fallido
      this.messages = this.messages.filter(m => m.channel_message_id !== clientTmpId);
    } finally {
      // cerrar modal
      this.closeFileModal?.();  // si lo tienes como modal separado
    }
  }


  getFileIcon(mime: string | null | undefined): string {
    if (!mime) return '📄';

    if (mime.includes('pdf')) return '📕 PDF';
    if (mime.includes('word')) return '📝 DOC';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return '📊 XLSX';
    if (mime.includes('presentation')) return '📽 PPT';

    return '📄';
  }

  // Estado para el modal de PDF
  isPdfPreviewOpen = false;
  pdfPreviewSafeUrl: SafeResourceUrl | null = null;
  currentPdfUrl: string | null = null;
  currentPdfFilename: string | null = null;

  async downloadFile(m: Message) {
    if (!m.id) {
      console.warn('Cannot download file without ID');
      this.alert.error('El mensaje no tiene ID, no se puede descargar.');
      return;
    }

    const filename = m.text_content || 'archivo';
    const isPdf = m.mime_type?.toLowerCase().includes('pdf') || filename.toLowerCase().endsWith('.pdf');

    try {
      // 1. Obtener URL del archivo desde la API
      console.log("Solicitando descarga archivo", m.id);
      const res = await this.chatService.downloadMessageFile(m.id);

      if (!res.success || !res.data?.url) {
        console.error('Error en respuesta de descarga:', res);
        this.alert.error('No se pudo obtener el enlace de descarga.');
        return;
      }

      // 2. Construir URL absoluta
      let baseUrl = environment.API.BASE;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 4);
      }
      const fullUrl = `${baseUrl}${res.data.url}`;

      console.log("Descargando desde:", fullUrl);

      // 3. Descargar/Visualizar
      if (isPdf) {
        // PDF -> Abrir en MODAL
        this.currentPdfUrl = fullUrl;
        this.currentPdfFilename = filename;
        this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
        this.isPdfPreviewOpen = true;
      } else {
        // Otros -> Descarga directa
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();

        // Limpieza
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
      }

    } catch (e) {
      console.error('Error downloading file:', e);
      this.alert.error('Error al descargar el archivo.');
    }
  }



  downloadCurrentPdf() {
    if (this.currentPdfUrl) {
      // Abrir en nueva pestaña para permitir que el usuario lo descargue desde el visor del navegador
      window.open(this.currentPdfUrl, '_blank');
    }
  }

  closePdfPreview() {
    this.isPdfPreviewOpen = false;
    this.pdfPreviewSafeUrl = null;
    this.currentPdfUrl = null;
  }

  safeAttachmentSrc(m?: Message | null): SafeResourceUrl {
    if (!m?.base64_content || !m?.mime_type) {
      return '';
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `data:${m.mime_type};base64,${m.base64_content}`
    );
  }

  isPdf(m?: Message | null): boolean {
    if (!m?.mime_type) return false;
    return m.mime_type.toLowerCase().startsWith('application/pdf');
  }

  startAudioRecording() {
    this.isAudioModalOpen = true;

  }

  async onAudioSend(event: any) {

    console.log("AUDIO RECIBIDO DEL MODAL", event);
    this.isAudioModalOpen = false;


    try {

      let base64 = "";
      let mime = "";
      let filename = "audio.webm";

      if (event.blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          base64 = (reader.result as string).split(',')[1];
          this.sendAudioMessage(base64, filename, mime);
        };
        reader.readAsDataURL(event.blob);
      } else {
        base64 = event.base64;
        mime = event.mime;
        filename = event.filename;
        await this.sendAudioMessage(base64, filename, mime);
      }

      // 🔥 La clave para que Angular SÍ cierre el modal
      setTimeout(() => {
        this.isAudioModalOpen = false;
      });
    } catch (err) {
      console.error("❌ Error al enviar audio", err);
      this.alert.error("Error al enviar audio");
    }
    this.isAudioModalOpen = false;
  }

  async sendAudioMessage(base64: string, filename: string, mime: string) {

    const msg = buildAgentAudioMessage(
      this.selectedCase!.case_id, // <-- garantía para TS de que NO es undefined
      filename,
      base64,
      mime
    );

    await this.chatService.sendMessage(msg)

  }

  closeAudioModal() {
    setTimeout(() => {
      this.isAudioModalOpen = false;
    }, 0);
  }

  onPhoneInput(): void {
    if (!this.newConvPhone) return;

    // elimina espacios, tabs, saltos
    this.newConvPhone = this.newConvPhone.replace(/\s+/g, '');
  }
}