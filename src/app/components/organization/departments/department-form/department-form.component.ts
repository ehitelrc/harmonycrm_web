import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Department } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.css']
})
export class DepartmentFormComponent implements OnInit, OnChanges {
  @Input() companyId!: number;                // obligatorio
  @Input() department: Department | null = null;

  @Output() success = new EventEmitter<Department>(); // o EventEmitter<number> si prefieres solo el id

  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private lang: LanguageService,
    private alert: AlertService
  ) {}

  get t() { return this.lang.t.bind(this.lang); }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] && this.form) {
      this.patchForm();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['']
    });
    this.patchForm();
  }

  private patchForm(): void {
    this.isEditing = !!this.department?.id;
    if (this.department) {
      this.form.patchValue({
        name: this.department.name || '',
        description: this.department.description || ''
      });
    } else {
      this.form.reset({ name: '', description: '' });
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return this.t('field_required');
    if (c.errors['maxlength']) return this.t('field_too_long');
    return this.t('invalid_field');
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      return;
    }
    try {
      this.isSubmitting = true;
      const payload = {
        ...this.form.value,
        company_id: this.companyId
      } as Partial<Department>;

      let resp;
      if (this.isEditing && this.department?.id) {
        resp = await this.departmentService.updateDepartment(this.department.id, payload);
      } else {
        resp = await this.departmentService.createDepartment(payload);
      }

      if (resp.success) {
        this.success.emit(resp.data);
      } else {
        this.alert.error(resp.message || this.t('operation_failed'));
      }
    } catch (e) {
      console.error(e);
      this.alert.error(this.t('operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) this.onCancel();
  }
}