import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseWithChannel } from '@app/models/case-with-channel.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads-list.component.html',
  styleUrls: ['./leads-list.component.css'],
})
export class LeadsListComponent {
  @Input() leads: CaseWithChannel[] = [];
  @Input() isLoading = false;

  @Output() view = new EventEmitter<CaseWithChannel>();
  @Output() edit = new EventEmitter<CaseWithChannel>();
  @Output() remove = new EventEmitter<CaseWithChannel>();

  searchTerm = '';

  constructor(private lang: LanguageService) {}
  get t() {
    return this.lang.t.bind(this.lang);
  }

  onSearch(v: string) {
    this.searchTerm = v || '';
  }

  get filtered(): CaseWithChannel[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.leads;

    return this.leads.filter((c) => {
      const byName = (c.client_name || '').toLowerCase().includes(q);
      const byPhone = (c.sender_id || '').toLowerCase().includes(q);
      const byStage = (c.funnel_stage || '').toLowerCase().includes(q);
      const byStatus = (c.status || '').toLowerCase().includes(q);
      return byName || byPhone || byStage || byStatus;
    });
  }

  onView(c: CaseWithChannel) {
    this.view.emit(c);
  }

  onEdit(c: CaseWithChannel) {
    this.edit.emit(c);
  }

  onRemove(c: CaseWithChannel) {
    this.remove.emit(c);
  }
}