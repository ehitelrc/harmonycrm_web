import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { Campaign } from '@app/models/campaign.model';
import { LanguageService } from '@app/services';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignsListComponent {
  @Input() campaigns: CampaignWithFunnel[] = [];
  @Input() isLoading = false;

  @Output() edit = new EventEmitter<CampaignWithFunnel>();
  @Output() remove = new EventEmitter<CampaignWithFunnel>();
  @Output() view = new EventEmitter<CampaignWithFunnel>();

  searchTerm = '';
  sortBy: 'id' | 'name' | 'start_date' | 'end_date' | 'is_active' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private lang: LanguageService) {}
  get t() { return this.lang.t.bind(this.lang); }

  onSearch(term: string) { this.searchTerm = term || ''; }
  onSort(field: typeof this.sortBy) {
    if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = field; this.sortOrder = 'asc'; }
  }

get filtered(): CampaignWithFunnel[] {
  console.log(this.campaigns);

  // Asegura que siempre trabajamos con un array
  const list: CampaignWithFunnel[] = Array.isArray(this.campaigns) ? this.campaigns : [];

  const q = (this.searchTerm || '').trim().toLowerCase();

  const filtered = list.filter(c => {
    const idMatch = q && !isNaN(Number(q)) ? String(c.campaign_id).includes(q) : false;
    const nameMatch = (c.campaign_name || '').toLowerCase().includes(q);
    return !q || idMatch || nameMatch;
  });

  filtered.sort((a, b) => {
    const A: any = (a as any)[this.sortBy];
    const B: any = (b as any)[this.sortBy];

    let av = A, bv = B;
    if (this.sortBy === 'id') { av = Number(A) || 0; bv = Number(B) || 0; }
    else if (this.sortBy === 'is_active') { av = A ? 1 : 0; bv = B ? 1 : 0; }
    else { av = String(A ?? '').toLowerCase(); bv = String(B ?? '').toLowerCase(); }

    if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
    if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
}

  onEdit(c: CampaignWithFunnel) { this.edit.emit(c); }
  onRemove(c: CampaignWithFunnel) { this.remove.emit(c); }
  onViewClick(c: CampaignWithFunnel) { this.view.emit(c); }
}