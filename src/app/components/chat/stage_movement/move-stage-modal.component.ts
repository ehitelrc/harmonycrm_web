// src/app/components/cases/move-stage-modal/move-stage-modal.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Funnel, FunnelStage } from '@app/models/funnel.model';

import { FunnelService } from '@app/services/funnel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';
import { VwCaseCurrentStage } from '@app/services/case.service';
import { MoveCaseStagePayload } from '@app/models/move_case_stager_payload';



@Component({
  selector: 'app-move-stage-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './move-stage-modal.component.html',
  styleUrls: ['./move-stage-modal.component.css'],
})
export class MoveStageModalComponent {
  /** Caso y estado actual (desde vw_case_current_stage) */
  @Input() caseId!: number;
  @Input() funnelId!: number;
  @Input() current!: VwCaseCurrentStage; // incluye funnel_id, stage actual, etc.

  /** Control de apertura/cierre desde el padre (opcional) */
  @Input() isOpen = false;

  /** Salidas */
  @Output() cancel = new EventEmitter<void>();
  @Output() moved = new EventEmitter<MoveCaseStagePayload>();

  /** UI/Modelo */
  stages: FunnelStage[] = [];
  selectedStageId: number | null = null;
  note = '';
  isLoadingStages = false;
  isSubmitting = false;

  constructor(
    private funnelService: FunnelService,
    private alert: AlertService,
    private lang: LanguageService
  ) { }

  get t() { return this.lang.t.bind(this.lang); }

  ngOnInit(): void {
    this.note = '';
    this.selectedStageId = null;
    this.bootstrap();
  }

  ngOnChanges(): void {
    // Si cambia el current o el open, re-carga
    if (this.isOpen) this.bootstrap();
  }

  private async bootstrap() {

    if (!this.current?.funnel_id) {
      this.stages = [];
      this.selectedStageId = null;
    }

    await this.loadStages(this.funnelId);
    // preselecciona distinto al actual si existe

    if (!this.current?.current_stage_id) {
      this.selectedStageId = null;
      this.note = '';

      return;
    }

    const currentId = this.current.current_stage_id ?? null;
    const firstOther = this.stages.find(s => s.id !== currentId);
    this.selectedStageId = firstOther?.id ?? null;
  }

  private async loadStages(funnelId: number) {
    try {
      this.isLoadingStages = true;

      // puede venir ApiResponse<FunnelStage[]> o FunnelStage[]
      const res = await this.funnelService.getStages(funnelId);

      // type guard para detectar ApiResponse
      const isApiResponseArray = <T>(x: any): x is { data: T[] } =>
        x && typeof x === 'object' && 'data' in x && Array.isArray((x as any).data);

      const raw = isApiResponseArray<FunnelStage>(res) ? res.data : res;
      const list: FunnelStage[] = Array.isArray(raw) ? raw : [];

      this.stages = list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    } catch {
      this.alert.error(this.t('funnel.failed_to_load_stages') || 'No se pudieron cargar los estados del embudo.');
      this.stages = [];
    } finally {
      this.isLoadingStages = false;
    }
  }

  sameAsCurrent(): boolean {
    const cur = this.current?.current_stage_id ?? null;
    return cur !== null && this.selectedStageId === cur;
  }

  canSubmit(): boolean {
    return !!this.caseId && !!this.funnelId && !!this.selectedStageId && !this.sameAsCurrent();
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.alert.error(this.t('case.select_different_stage') || 'Seleccione un estado diferente al actual.');
      return;
    };

    const payload: MoveCaseStagePayload = {
      case_id: this.caseId,
      funnel_id: this.funnelId!,
      from_stage_id: this.current ? this.current.current_stage_id ?? null : null,
      to_stage_id: this.selectedStageId!,
      note: (this.note || '').trim() || null,
    };

    this.isSubmitting = true;
    // No llamo al backend aquí; dejo que el padre lo haga con (moved)
    this.moved.emit(payload);
    this.isSubmitting = false;
  }

  close(): void {
    this.cancel.emit();
  }
}