import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent implements OnInit, OnChanges {
  @Input() company?: Company | null;
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private languageService: LanguageService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['company'] && this.form) {
      this.isEditing = !!this.company?.id;
      this.patchForm();
    }
  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      industry: ['']
    });
    this.patchForm();
  }

  private patchForm(): void {
    if (this.company) {
      this.form.patchValue({
        name: this.company.name || '',
        industry: this.company.industry || ''
      });
      this.isEditing = !!this.company.id;
    } else {
      this.form.reset({
        name: '',
        industry: ''
      });
      this.isEditing = false;
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return this.t('field_required');
    if (ctrl.errors['maxlength']) return this.t('field_too_long');
    return this.t('invalid_field');
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      return;
    }

    try {
      this.isSubmitting = true;
      const payload = this.form.value as Partial<Company>;

      let resp;
      if (this.isEditing && this.company?.id) {
        resp = await this.companyService.updateCompany(this.company.id, payload);
      } else {
        resp = await this.companyService.createCompany(payload);
      }

      if (resp.success) {
        this.success.emit();
        this.resetForm();
      } else {
        this.alertService.error(resp.message || this.t('operation_failed'));
      }
    } catch (err) {
      console.error('Company save error:', err);
      this.alertService.error(this.t('operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.company = null;
    this.form.reset({ name: '', industry: '' });
    this.isEditing = false;
  }

  close(): void {
    this.onCancel();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}