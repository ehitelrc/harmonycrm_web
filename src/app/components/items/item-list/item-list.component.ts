import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Item } from '@app/models/item.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})
export class ItemsListComponent {
  @Input() items: Item[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<Item>();
  @Output() remove = new EventEmitter<Item>();
  @Output() view = new EventEmitter<Item>();

  searchTerm = '';
  sortBy: 'id' | 'name' | 'type' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(v: string) { this.searchTerm = v || ''; }

  onSort(field: 'id' | 'name' | 'type') {
    if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = field; this.sortOrder = 'asc'; }
  }

  get filtered(): Item[] {
    const q = this.searchTerm.trim().toLowerCase();
    let list = this.items.filter(it => {
      const byId = q && !isNaN(Number(q)) ? String(it.id).includes(q) : false;
      const byName = (it.name || '').toLowerCase().includes(q);
      const byType = (it.type || '').toLowerCase().includes(q);
      return !q || byId || byName || byType;
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

  onEdit(i: Item)   { this.edit.emit(i); }
  onRemove(i: Item) { this.remove.emit(i); }
  onView(i: Item)   { this.view.emit(i); }
}