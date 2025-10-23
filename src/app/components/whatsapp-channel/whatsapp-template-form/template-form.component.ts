// components/templates/template-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WhatsAppTemplate } from '@app/models/whatsapp-template.model';

import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { ChannelIntegrationShort } from '@app/models/channel-integration-short.model';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './template-form.component.html'
})
export class TemplateFormComponent implements OnInit {
  @Input() channelIntegrationId: number | null = null; // viene del padre
  @Input() template: WhatsAppTemplate | null = null;
  @Output() success = new EventEmitter<WhatsAppTemplate>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;
  channels: ChannelIntegrationShort[] = [];

  constructor(
    private fb: FormBuilder,
    private service: WhatsAppTemplateService,
    private alert: AlertService,
    private lang: LanguageService
  ) { }

  get t() { return this.lang.t.bind(this.lang); }

  async ngOnInit(): Promise<void> {
    this.build();
    await this.loadChannels();
    this.patch();
  }

  private build(): void {
    this.form = this.fb.group({
      template_name: ['', [Validators.required, Validators.maxLength(200)]],
      language: ['', [Validators.required]],
      channel_integration: [null, Validators.required],
      template_url_webhook: ['', [Validators.maxLength(500)]], // nuevo campo
      active: [true]
    });

    this.form.get('channel_integration')?.setValue(this.channelIntegrationId);
  }

  private patch(): void {
    if (!this.template) return;
    this.isEditing = true;
    this.form.patchValue({
      template_name: this.template.template_name,
      language: this.template.language,
      channel_integration: this.template.channel_integration_id,
      template_url_webhook: this.template.template_url_webhook || '',
      active: this.template.active
    });
    this.form.get('channel_integration')?.setValue(this.channelIntegrationId);
  }

  private async loadChannels() {
    const r = await this.service.getChannels();
    if (r.success && r.data) this.channels = r.data;
  }



  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const payload = {
        ...this.form.value,
        channelIntegrationId: this.channelIntegrationId // 🚀 viene del padre
      };

      let resp;
      if (this.isEditing && this.template) {
        resp = await this.service.updateWhatsappTemplate(this.template.id, payload);
      } else {
        resp = await this.service.createWhatsappTemplate(payload);
      }

      if (resp.success && resp.data) {
        this.success.emit(resp.data);
      } else {
        this.alert.error(resp.message || this.t('template.operation_failed'));
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void { this.cancel.emit(); }
}