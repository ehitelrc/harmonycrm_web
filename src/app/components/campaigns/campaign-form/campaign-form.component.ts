import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Campaign } from '@app/models/campaign.model';
import { CampaignService } from '@app/services/campaign.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { FunnelService } from '@app/services/funnel.service';
import { Funnel } from '@app/models/funnel.model';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-form.component.html',
  styleUrls: ['./campaign-form.component.css']
})
export class CampaignFormComponent implements OnInit, OnChanges {
  @Input() companyId!: number;
  @Input() campaign: CampaignWithFunnel | null = null;
  @Output() success = new EventEmitter<CampaignWithFunnel>();
  @Output() cancel = new EventEmitter<void>();

  model: Partial<Campaign> = {
    name: '',
    start_date: null as string | null,
    end_date: null as string | null,
    description: '',
    funnel_id: null,
    is_active: true
  };
  isSubmitting = false;

  funnels: Funnel[] = [];

  constructor(
    private service: CampaignService,
    private alert: AlertService,
    private lang: LanguageService,
    private funnelService: FunnelService,
  ) {}
  get t() { return this.lang.t.bind(this.lang); }

  async ngOnInit(): Promise<void> {
    this.patchFromInput();
    await this.loadFunnels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaign'] && !changes['campaign'].firstChange) {
      this.patchFromInput();
    }
  }

  /** Normaliza al formato requerido por <input type="date"> (YYYY-MM-DD) */
  private toInputDate(v: string | Date | null | undefined): string | null {
    if (!v) return null;
    if (v instanceof Date && !isNaN(v.valueOf())) {
      return v.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    const s = String(v);
    // Si viene ISO "YYYY-MM-DDTHH:mm:ssZ"
    if (s.includes('T')) return s.split('T')[0];
    // Si ya viene como YYYY-MM-DD, lo dejamos
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Si viene "YYYY/MM/DD" u otro, intenta parsear
    const parsed = new Date(s);
    return isNaN(parsed.valueOf()) ? null : parsed.toISOString().slice(0, 10);
    // Nota: si tus fechas son solo 'date' de Postgres, normalmente ya vienen como 'YYYY-MM-DD'
  }

  /** Carga valores del @Input() campaign en el modelo local, normalizando fechas */
  private patchFromInput(): void {
    if (this.campaign) {
      this.model = {
        // name en la vista viene como campaign_name
        name: this.campaign.campaign_name ?? '',
        start_date: this.toInputDate(this.campaign.start_date),
        end_date: this.toInputDate(this.campaign.end_date),
        description: this.campaign.description ?? '',
        is_active: this.campaign.is_active ?? true,
        funnel_id: this.campaign.funnel_id ?? null
      };
    } else {
      this.model = {
        name: '',
        start_date: null,
        end_date: null,
        description: '',
        is_active: true,
        funnel_id: null
      };
    }
  }

  private async loadFunnels(): Promise<void> {
    try {
      const res = await this.funnelService.getAll();
      if (res.success && Array.isArray(res.data)) {
        this.funnels = res.data;
      } else {
        this.alert.error(this.t('campaign.failed_to_load_funnels'));
      }
    } catch {
      this.alert.error(this.t('campaign.failed_to_load_funnels'));
    }
  }

  async submit(): Promise<void> {
    if (!this.companyId) return;
    this.isSubmitting = true;
    try {
      const payload = { ...this.model, company_id: this.companyId };

      const res = this.campaign
        ? await this.service.update(this.campaign.campaign_id, payload)
        : await this.service.create(payload);

      if (res.success && res.data) {
        this.success.emit(res.data);
      } else {
        this.alert.error(this.t('campaign.operation_failed'));
      }
    } catch {
      this.alert.error(this.t('campaign.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() { this.cancel.emit(); }
}