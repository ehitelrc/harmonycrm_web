import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelIntegration, ChannelIntegrationDTO } from '@app/models/channel-integration.model';
import { LanguageService } from '@app/services';

@Component({
  selector: 'app-channel-integrations-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-integrations-list.component.html',
  styleUrls: ['./channel-integrations-list.component.css']
})
export class ChannelIntegrationsListComponent {
  @Input() integrations: ChannelIntegrationDTO[] = [];
  @Input() isLoading = false;

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<ChannelIntegrationDTO>();
  @Output() remove = new EventEmitter<ChannelIntegrationDTO>();

  searchTerm = '';

  constructor(private lang: LanguageService) {
    console.log('ChannelIntegrationsListComponent initialized with integrations:', this.integrations);
  }
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(term: string) {
    this.searchTerm = term.trim().toLowerCase();

  }

  get filtered(): ChannelIntegrationDTO[] {
    const q = this.searchTerm;
    if (!q) return this.integrations;

    return this.integrations.filter(i =>
      i.webhook_url.toLowerCase().includes(q) ||
      (i.app_identifier ?? '').toLowerCase().includes(q) ||
      (i.access_token ?? '').toLowerCase().includes(q)
    );
  }

  onAdd() { this.add.emit(); }
  onEdit(integration: ChannelIntegrationDTO) { this.edit.emit(integration); }
  onRemove(integration: ChannelIntegrationDTO) { this.remove.emit(integration); }
}