import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent implements OnInit, OnChanges {
  @Input() client: Client | null = null;
  @Output() success = new EventEmitter<Client>();     // emitimos el objeto -> tendrás el id
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private service: ClientService,
    private lang: LanguageService,
    private alert: AlertService
  ) {}

  get t() { return this.lang.t.bind(this.lang); }

  ngOnInit(): void { this.build(); this.patch(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client'] && this.form) { this.isEditing = !!this.client; this.patch(); }
  }

  private build(): void {
    this.form = this.fb.group({
      external_id: [''],
      full_name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(50)]],
    });
  }

  private patch(): void {
    if (!this.client) { this.isEditing = false; this.form.reset(); return; }
    this.isEditing = true;
    this.form.patchValue({
      external_id: this.client.external_id || '',
      full_name: this.client.full_name || '',
      email: this.client.email || '',
      phone: this.client.phone || '',
    });
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    try {
      let resp;
      if (this.isEditing && this.client) {
        resp = await this.service.update(this.client.id, this.form.value);
      } else {
        resp = await this.service.create(this.form.value);
      }

      if (resp.success && resp.data) {
        this.success.emit(resp.data); // -> incluye id
      } else {
        this.alert.error(resp.message || this.t('client.operation_failed'));
      }
    } catch (e) {
      console.error(e);
      this.alert.error(this.t('client.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void { this.cancel.emit(); }
}