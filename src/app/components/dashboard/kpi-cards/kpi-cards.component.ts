import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardGeneralByCompany } from '@app/models/dashboard_general_by_company_view';
 
import { LanguageService } from '@app/services/extras/language.service';


@Component({
  selector: 'app-dashboard-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ng-container *ngIf="stats; else skeleton">
        <div *ngFor="let kpi of kpis"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition transform hover:scale-105 hover:shadow-lg">
          
          <!-- Icono circular -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                   [ngStyle]="{'background': kpi.bg}">
                <span class="h-6 w-6 text-white" [innerHTML]="sanitize(kpi.icon)"></span>
              </div>
              <div class="ml-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ kpi.title }}</dt>
                <dd class="text-2xl font-bold text-[var(--foreground)]">{{ kpi.value }}</dd>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Skeleton de carga -->
      <ng-template #skeleton>
        <div class="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
             *ngFor="let _ of [0,1,2,3,4,5]">
          <div class="h-16 bg-gray-200 rounded"></div>
        </div>
      </ng-template>
    </div>
  `,
})
export class KpiCardsComponent {
  @Input() stats: DashboardGeneralByCompany | null = null;

  constructor(private languageService: LanguageService, private sanitizer: DomSanitizer) {}

  get kpis() {
    if (!this.stats) return [];
    return [
      {
        title: this.t('dashboard.total_active_campaigns'),
        value: this.stats.total_active_campaigns.toLocaleString(),
        icon: this.campaignSvg,
        bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      },
      {
        title: this.t('dashboard.total_cases'),
        value: this.stats.total_cases.toLocaleString(),
        icon: this.casesSvg,
        bg: 'linear-gradient(135deg, #9333ea, #a855f7)',
      },
      {
        title: this.t('dashboard.closed_cases'),
        value: this.stats.closed_cases.toLocaleString(),
        icon: this.closedSvg,
        bg: 'linear-gradient(135deg, #ef4444, #f87171)',
      },
      {
        title: this.t('dashboard.won_cases'),
        value: this.stats.won_cases.toLocaleString(),
        icon: this.wonSvg,
        bg: 'linear-gradient(135deg, #10b981, #34d399)',
      },
      {
        title: this.t('dashboard.conversion_rate'),
        value: `${this.stats.conversion_rate}%`,
        icon: this.rateSvg,
        bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      },
      {
        title: this.t('dashboard.operating_agents'),
        value: this.stats.operating_agents.toLocaleString(),
        icon: this.agentsSvg,
        bg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      },
    ];
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  sanitize(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  // 👇 Puedes mantener los mismos SVGs que ya tienes
  private get campaignSvg() { return `<svg ...></svg>`; }
  private get casesSvg() { return `<svg ...></svg>`; }
  private get closedSvg() { return `<svg ...></svg>`; }
  private get wonSvg() { return `<svg ...></svg>`; }
  private get rateSvg() { return `<svg ...></svg>`; }
  private get agentsSvg() { return `<svg ...></svg>`; }
}