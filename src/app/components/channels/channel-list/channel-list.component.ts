import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel } from '@app/models/channel.model';
import { LanguageService } from '@app/services';

@Component({
  selector: 'app-channels-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.css']
})
export class ChannelsListComponent {
  @Input() channels: Channel[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<Channel>();
  @Output() remove = new EventEmitter<Channel>();
  @Output() view = new EventEmitter<Channel>();

  searchTerm = '';
  sortBy: 'id' | 'code' | 'name' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(term: string) { this.searchTerm = term || ''; }
  onSort(field: typeof this.sortBy) {
    if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = field; this.sortOrder = 'asc'; }
  }

  get filtered(): Channel[] {
    const q = this.searchTerm.trim().toLowerCase();
    let list = this.channels.filter(ch => {
      const idMatch = q && !isNaN(Number(q)) ? String(ch.id).includes(q) : false;
      const codeMatch = (ch.code || '').toLowerCase().includes(q);
      const nameMatch = (ch.name || '').toLowerCase().includes(q);
      return !q || idMatch || codeMatch || nameMatch;
    });

    list.sort((a, b) => {
      const A: any = (a as any)[this.sortBy];
      const B: any = (b as any)[this.sortBy];

      let av = A, bv = B;
      if (this.sortBy === 'id') { av = Number(A)||0; bv = Number(B)||0; }
      else { av = String(A ?? '').toLowerCase(); bv = String(B ?? '').toLowerCase(); }

      if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  onEdit(ch: Channel) { this.edit.emit(ch); }
  onRemove(ch: Channel) { this.remove.emit(ch); }
  onViewClick(ch: Channel) { this.view.emit(ch); }
}