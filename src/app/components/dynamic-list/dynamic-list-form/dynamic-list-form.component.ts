import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomListService } from '@app/services/custom-list.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';
import { id } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dynamic-list-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-list-form.component.html'
})
export class DynamicListFormComponent implements OnInit {

  @Input() list!: any;
  @Input() value: any = null;

  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private customListService: CustomListService,
    private lang: LanguageService,
    private alert: AlertService,
  ) {}

  get t() {
    return this.lang.t.bind(this.lang);
  }

  ngOnInit(): void {
    this.isEditing = !!this.value?.id;

    this.form = this.fb.group({
      id: [this.value?.id || null],
      list_id: [this.list.list_id, Validators.required],
      code_value: [this.value?.code || '', Validators.maxLength(100)],
      description_value: [this.value?.description || '', Validators.required]
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;

      if (this.isEditing) {
        const resp = await this.customListService.updateValue(this.form.value);
        if (!resp.success) return this.alert.error(resp.message ? resp.message : this.t('update_failed'), this.t('update_failed'));
      } else {
        const payload = {
          list_id: this.list.list_id,
          ...this.form.value
        };

        const resp = await this.customListService.createValue(payload);
        if (!resp.success) return this.alert.error(resp.message ? resp.message : this.t('creation_failed'), this.t('creation_failed'));
      }

      this.success.emit();
    } catch {
      this.alert.error(this.t('operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  close() {
    this.cancel.emit();
  }
}