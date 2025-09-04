import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from '@app/models/client.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css'],
})
export class ClientsListComponent {
  @Input() clients: Client[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<Client>();
  @Output() remove = new EventEmitter<Client>();
  @Output() view = new EventEmitter<Client>();

  searchTerm = '';
  sortBy: 'id' | 'full_name' | 'email' | 'phone' = 'full_name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(v: string) { this.searchTerm = v || ''; }

  onSort(field: 'id' | 'full_name' | 'email' | 'phone') {
    if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = field; this.sortOrder = 'asc'; }
  }

  get filtered(): Client[] {
    const q = this.searchTerm.trim().toLowerCase();
    let list = this.clients.filter(c => {
      const byId = q && !isNaN(Number(q)) ? String(c.id).includes(q) : false;
      const byName = (c.full_name || '').toLowerCase().includes(q);
      const byEmail = (c.email || '').toLowerCase().includes(q);
      const byPhone = (c.phone || '').toLowerCase().includes(q);
      const byExt = (c.external_id || '').toLowerCase().includes(q);
      return !q || byId || byName || byEmail || byPhone || byExt;
    });

    list.sort((a, b) => {
      let av: any = a[this.sortBy] ?? '';
      let bv: any = b[this.sortBy] ?? '';
      if (this.sortBy === 'id') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  onEdit(c: Client) { this.edit.emit(c); }
  onRemove(c: Client) { this.remove.emit(c); }
  onView(c: Client) { this.view.emit(c); }
}