import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelIntegration } from '@app/models/channel-integration.model';
import { ChannelService } from '@app/services/channel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';

@Component({
  selector: 'app-channel-integration-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-integration-form.component.html',
  styleUrls: ['./channel-integration-form.component.css']
})
export class ChannelIntegrationFormComponent {
  @Input() integration: ChannelIntegration | null = null;
  @Input() companyId!: number;
  @Input() channelId!: number;

  @Output() success = new EventEmitter<ChannelIntegration>();
  @Output() cancel = new EventEmitter<void>();

  model: Partial<ChannelIntegration> = {
    webhook_url: '',
    access_token: '',
    app_identifier: '',
    is_active: true
  };

  isSubmitting = false;

  constructor(
    private service: ChannelService,
    private alert: AlertService,
    private lang: LanguageService
  ) {}

  get t() {
    return this.lang.t.bind(this.lang);
  }

  ngOnInit(): void {
    if (this.integration) {
      this.model = { ...this.integration };
    }
  }

  async submit(): Promise<void> {
    this.isSubmitting = true;
    try {
      const payload = {
        ...this.model,
        company_id: this.companyId,
        channel_id: this.channelId,
      };

      let res;
      if (this.integration) {
        res = await this.service.UpdateIntegration(this.integration.id, payload);
      } else {
        res = await this.service.CreateIntegration(payload);
      }

      if (res.success && res.data) {
        this.alert.success(this.t('integration.saved_successfully'));
        this.success.emit(res.data);
      } else {
        this.alert.error(this.t('integration.save_failed'));
      }
    } catch (e) {
      this.alert.error(this.t('integration.save_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}