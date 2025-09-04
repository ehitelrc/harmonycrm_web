import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';
import { FunnelStage } from '@app/models/funnel.model';
import { FunnelService } from '@app/services/funnel.service';

@Component({
  selector: 'app-stage-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stages-form.component.html',
  styleUrls: ['./stages-form.component.css'],
})
export class StageFormComponent implements OnInit, OnChanges {
  /** Funnel al que pertenece la etapa (requerido al crear) */
  @Input() funnelId!: number;

  /** Etapa a editar (si null/undefined => crear) */
  @Input() stage?: FunnelStage | null;

  /** Eventos */
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private funnelService: FunnelService,
    private languageService: LanguageService,
    private alertService: AlertService
  ) {}

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  ngOnInit(): void {
    this.initForm();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['stage'] || changes['funnelId']) && this.form) {
      this.isEditing = !!this.stage?.id;
      this.patchForm();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      position: [0, [Validators.required, this.nonNegativeIntegerValidator]],
      is_won: [false],
      is_lost: [false],
      sla_hours: [null, this.nonNegativeOrNullValidator],
    });
  }

  /** Carga valores del input en el form */
  private patchForm(): void {
    if (this.stage && this.stage.id) {
      this.form.patchValue({
        name: this.stage.name ?? '',
        position: this.stage.position ?? 0,
        is_won: !!this.stage.is_won,
        is_lost: !!this.stage.is_lost,
 
      });
      this.isEditing = true;
    } else {
      this.form.reset({
        name: '',
        position: 0,
        is_won: false,
        is_lost: false,
        sla_hours: null,
      });
      this.isEditing = false;
    }
  }

  /** Validadores */
  private nonNegativeOrNullValidator = (ctrl: FormControl) => {
    const v = ctrl.value;
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? null : { nonNegative: true };
  };

  private nonNegativeIntegerValidator = (ctrl: FormControl) => {
    const n = Number(ctrl.value);
    return Number.isInteger(n) && n >= 0 ? null : { nonNegativeInteger: true };
  };

  /** Utils de validación */
  isFieldInvalid(field: keyof FunnelStage | 'sla_hours'): boolean {
    const c = this.form.get(String(field));
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getFieldError(field: keyof FunnelStage | 'sla_hours'): string {
    const c = this.form.get(String(field));
    if (!c || !c.errors) return '';
    if (c.errors['required']) return this.t('field_required') || 'Campo requerido';
    if (c.errors['maxlength']) return this.t('field_too_long') || 'Texto demasiado largo';
    if (c.errors['nonNegativeInteger']) return this.t('must_be_non_negative_integer') || 'Debe ser entero ≥ 0';
    if (c.errors['nonNegative']) return this.t('must_be_non_negative') || 'Debe ser ≥ 0';
    return this.t('invalid_field') || 'Dato inválido';
  }

  /** Submit */
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const base = this.form.value as Partial<FunnelStage>;

    // API de update requiere el id en el body (no por URL)
    const payload: Partial<FunnelStage> =
      this.isEditing && this.stage?.id
        ? { id: this.stage.id, funnel_id: this.stage.funnel_id, ...base }
        : base;

    try {
      this.isSubmitting = true;

      const resp = this.isEditing && this.stage?.id
        ? await this.funnelService.updateStage(payload)           // PUT con { id, ... }
        : await this.funnelService.createStage(this.funnelId, payload); // POST /funnels/:id/stages

      if (resp?.success) {
        this.success.emit();
        this.resetForm();
      } else {
        this.alertService.error(resp?.message || this.t('operation_failed') || 'Operación fallida');
      }
    } catch (err) {
      console.error('Stage save error:', err);
      this.alertService.error(this.t('operation_failed') || 'Operación fallida');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  close(): void {
    this.onCancel();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) this.close();
  }

  private resetForm(): void {
    this.stage = null;
    this.form.reset({
      name: '',
      position: 0,
      is_won: false,
      is_lost: false,
      sla_hours: null,
    });
    this.isEditing = false;
  }
}