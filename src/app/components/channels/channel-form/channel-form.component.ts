import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel } from '@app/models/channel.model';
import { ChannelService } from '@app/services/channel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services';

@Component({
  selector: 'app-channel-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-form.component.html',
  styleUrls: ['./channel-form.component.css']
})
export class ChannelFormComponent {
  @Input() channel: Channel | null = null;
  @Output() success = new EventEmitter<Channel>();
  @Output() cancel = new EventEmitter<void>();

  model: Partial<Channel> = { code: '', name: '', description: '' };
  isSubmitting = false;

  constructor(
    private service: ChannelService,
    private alert: AlertService,
    private lang: LanguageService
  ) {}
  get t() { return this.lang.t.bind(this.lang); }

  ngOnInit(): void {
    if (this.channel) {
      this.model = { ...this.channel };
    }
  }

  async submit(): Promise<void> {
    this.isSubmitting = true;
    try {
      let res;
      if (this.channel) res = await this.service.update(this.channel.id, this.model);
      else res = await this.service.create(this.model);

      if (res.success && res.data) {
        this.success.emit(res.data);
      } else {
        this.alert.error(this.t('channel.operation_failed'));
      }
    } catch {
      this.alert.error(this.t('channel.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() { this.cancel.emit(); }
}