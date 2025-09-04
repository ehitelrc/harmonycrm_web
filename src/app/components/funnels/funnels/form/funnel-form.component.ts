import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';
import { FunnelService } from '@app/services/funnel.service';
import { Funnel } from '@app/models/funnel.model';

@Component({
    selector: 'app-funnel-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './funnel-form.component.html',
    styleUrls: ['./funnel-form.component.css']
})
export class FunnelFormComponent implements OnInit, OnChanges {
    @Input() funnel?: Funnel | null;
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
    ) { }

    get t() {
        return this.languageService.t.bind(this.languageService);
    }

    ngOnInit(): void {
        this.initForm();
        this.patchForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['funnel'] && this.form) {
            this.isEditing = !!this.funnel?.id;
            // Parchea valores cuando abres en modo edición
            if (this.funnel) {
                this.form.patchValue({
                    name: this.funnel.name ?? '',
                    description: this.funnel.description ?? '',
                    is_active: this.funnel.is_active ?? true
                });
            } else {
                this.form.reset({ name: '', description: '', is_active: true });
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(120)]],
            description: [''],
            is_active: [true],
        });
    }

    /** Carga los datos del Input en el formulario (sin etapas) */
    private patchForm(): void {
        if (this.funnel && this.funnel.id) {
            this.form.patchValue({
                name: this.funnel.name ?? '',
                description: this.funnel.description ?? '',
                is_active: this.funnel.is_active ?? true,
            });
            this.isEditing = true;
        } else {
            this.form.reset({
                name: '',
                description: '',
                is_active: true,
            });
            this.isEditing = false;
        }
    }

    /** Utils de validación */
    isFieldInvalid(field: keyof Funnel): boolean {
        const c = this.form.get(String(field));
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    getFieldError(field: keyof Funnel): string {
        const c = this.form.get(String(field));
        if (!c || !c.errors) return '';
        if (c.errors['required']) return this.t('field_required') || 'Campo requerido';
        if (c.errors['maxlength']) return this.t('field_too_long') || 'Texto demasiado largo';
        return this.t('invalid_field') || 'Dato inválido';
    }

    /** Submit */
   async onSubmit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const base = this.form.value as Partial<Funnel>;

  // ⬇️ API requiere el id dentro del JSON al actualizar
  const payload: Partial<Funnel> =
    this.isEditing && this.funnel?.id ? { id: this.funnel.id, ...base } : base;

  try {
    this.isSubmitting = true;
    const resp = this.isEditing && this.funnel?.id
      ? await this.funnelService.update(payload)   // <- ver servicio abajo
      : await this.funnelService.create(payload);

    if (resp?.success) {
      this.success.emit();
      this.resetForm();
    } else {
      this.alertService.error(resp?.message || this.t('operation_failed'));
    }
  } catch (err) {
    console.error('Funnel save error:', err);
    this.alertService.error(this.t('operation_failed'));
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
        this.funnel = null;
        this.form.reset({
            name: '',
            description: '',
            is_active: true,
        });
        this.isEditing = false;
    }
}