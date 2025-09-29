import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { DashboardCampaignFunnelSummary } from '@app/models/campaign_funnel_summary_view';

@Component({
  selector: 'app-campaign-funnel-organic',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .funnel-wrapper {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-top: 1.5rem;
      display: flex;
      gap: 2rem;
    }

    .funnel-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary, #00113f);
      margin-bottom: 1rem;
    }

    .funnel-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center; /* centra los elementos en el eje horizontal */
      gap: 12px;
    }

    .funnel-stage {
      position: relative;
      height: 36px;
      border-radius: 9999px; /* tubo redondeado */
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      margin: 0 auto; /* centra cada barra */
    }

    .funnel-stage:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    }

    .funnel-data {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .funnel-data-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 1rem;
      font-weight: 500; /* más intenso */
      color: #1f2937;   /* gris-800 */
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .funnel-data-item:last-child {
      border-bottom: none;
    }

    .color-circle {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }
  `],
  template: `
    <div class="funnel-wrapper">
      <!-- Columna Funnel -->
      <div class="funnel-container">
        <h3 class="funnel-title">Funnel de la campaña</h3>
        <div
          *ngFor="let stage of sortedStages"
          class="funnel-stage"
          [style.width.%]="getWidth(stage.total_cases)"
          [style.background]="getBackground(stage.color_hex, stage.total_cases)"
        >
          {{ stage.total_cases }}
        </div>

        <div *ngIf="sortedStages.length === 0" class="text-center text-gray-500 py-6">
          No hay datos de funnel disponibles.
        </div>
      </div>

      <!-- Columna Datos -->
      <div class="funnel-data">
        <h3 class="funnel-title">Resumen</h3>
        <div *ngFor="let stage of sortedStages" class="funnel-data-item">
          <div class="flex items-center">
            <span class="color-circle" [style.background]="stage.color_hex || '#9ca3af'"></span>
            {{ stage.stage_name }}
          </div>
          <div>
            <span class="font-semibold">{{ stage.total_cases }}</span>
            <span class="text-gray-600 text-sm ml-2">({{ getPercentage(stage.total_cases) }}%)</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CampaignFunnelOrganicComponent implements OnChanges {
  @Input() stages: DashboardCampaignFunnelSummary[] = [];
  sortedStages: DashboardCampaignFunnelSummary[] = [];
  maxCases = 0;
  totalCases = 0;

  ngOnChanges(): void {
    this.sortedStages = (this.stages || [])
      .map(s => ({ ...s, total_cases: Number(s.total_cases ?? 0) }))
      .sort((a, b) => a.position - b.position);

    this.maxCases = this.sortedStages.length
      ? Math.max(...this.sortedStages.map(s => s.total_cases))
      : 0;

    this.totalCases = this.sortedStages.reduce((sum, s) => sum + s.total_cases, 0);
  }

  getWidth(value: number): number {
    if (this.maxCases === 0) return 40;
    if (value === 0) return 40;
    const percentage = (value / this.maxCases) * 100;
    return Math.max(40, percentage);
  }

  getBackground(color: string | null, value: number): string {
    if (value === 0) {
      return `linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)`;
    }
    const base = color || '#3b82f6';
    return `linear-gradient(135deg, ${base} 0%, ${this.shadeColor(base, -15)} 100%)`;
  }

  getPercentage(value: number): string {
    if (this.totalCases === 0) return '0';
    return ((value / this.totalCases) * 100).toFixed(1);
  }

  private shadeColor(color: string, percent: number): string {
    const f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = Math.abs(percent) / 100,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff;
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      ).toString(16).slice(1)
    );
  }
}