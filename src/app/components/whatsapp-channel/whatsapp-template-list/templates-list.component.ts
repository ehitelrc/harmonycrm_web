// components/templates/templates-list.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppTemplate } from '@app/models/whatsapp-template.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './templates-list.component.html'
})
export class TemplatesListComponent {
  @Input() templates: WhatsAppTemplate[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<WhatsAppTemplate>();
  @Output() remove = new EventEmitter<WhatsAppTemplate>();
  @Output() view = new EventEmitter<WhatsAppTemplate>();

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onEdit(t: WhatsAppTemplate) { this.edit.emit(t); }
  onRemove(t: WhatsAppTemplate) { this.remove.emit(t); }
  onView(t: WhatsAppTemplate) { this.view.emit(t); }
}