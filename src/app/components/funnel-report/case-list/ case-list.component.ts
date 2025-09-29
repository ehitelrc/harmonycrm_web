import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseGeneralInformation } from '@app/models/case_general_information_view.model';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './case-list.component.html',
  styleUrls: ['./case-list.component.css']
})
export class CaseListComponent {
  @Input() cases: CaseGeneralInformation[] = [];
  @Input() isLoading = false;

  @Output() view = new EventEmitter<CaseGeneralInformation>();
  @Output() edit = new EventEmitter<CaseGeneralInformation>();
  @Output() remove = new EventEmitter<CaseGeneralInformation>();

  searchTerm = '';
  sortBy: keyof CaseGeneralInformation = 'case_id';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(v: string) { this.searchTerm = v || ''; }

  onSort(field: keyof CaseGeneralInformation) {
    if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = field; this.sortOrder = 'asc'; }
  }

  get filtered(): CaseGeneralInformation[] {
    const q = this.searchTerm.trim().toLowerCase();
    let list = this.cases.filter(c => {
      return !q ||
        String(c.case_id).includes(q) ||
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.department_name || '').toLowerCase().includes(q) ||
        (c.channel_name || '').toLowerCase().includes(q) ||
        (c.current_stage_name || '').toLowerCase().includes(q) ||
        (c.agent_name || '').toLowerCase().includes(q);
    });

    list.sort((a, b) => {
      let av: any = a[this.sortBy] ?? '';
      let bv: any = b[this.sortBy] ?? '';
      if (this.sortBy === 'case_id') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  onView(c: CaseGeneralInformation) { this.view.emit(c); }
  onEdit(c: CaseGeneralInformation) { this.edit.emit(c); }
  onRemove(c: CaseGeneralInformation) { this.remove.emit(c); }
}