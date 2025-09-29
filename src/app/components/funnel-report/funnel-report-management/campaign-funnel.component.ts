import { Component, Input, OnChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
    ApexChart,
    ApexDataLabels,
    ApexPlotOptions,
    ApexTitleSubtitle,
    ApexTooltip,
} from 'ng-apexcharts';
import { DashboardCampaignFunnelSummary } from '@app/models/campaign_funnel_summary_view';
import { CommonModule } from '@angular/common';

export type FunnelChartOptions = {
    series: { name: string; data: number[] }[];
    chart: ApexChart;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    tooltip: ApexTooltip;
    title: ApexTitleSubtitle;
    xaxis?: any;
    colors?: string[];
};

@Component({
    standalone: true,
    imports: [NgApexchartsModule,
        CommonModule
    ],
    selector: 'app-campaign-funnel',
    styleUrls: ['./campaign-funnel.component.css'],
    template: `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-6">
      <h3 class="text-lg font-semibold text-primary mb-4">
        Funnel de la campaña
      </h3>
 

      <apx-chart
        *ngIf="chartOptions"
        [series]="chartOptions.series!"
        [chart]="chartOptions.chart!"
        [plotOptions]="chartOptions.plotOptions!"
        [dataLabels]="chartOptions.dataLabels!"
        [tooltip]="chartOptions.tooltip!"
        [title]="chartOptions.title!"
        [xaxis]="chartOptions.xaxis!"
        [colors]="chartOptions.colors!"
      ></apx-chart>

      <div *ngIf="!stages || stages.length === 0" class="text-center text-gray-500 py-6">
        No hay datos de funnel disponibles.
      </div>
    </div>
  `,
})
export class CampaignFunnelComponent implements OnChanges {
    @Input() stages: DashboardCampaignFunnelSummary[] = [];

    chartOptions!: Partial<FunnelChartOptions>;

    ngOnChanges(): void {
        if (!this.stages || this.stages.length === 0) return;

        this.chartOptions = {
            series: [
                {
                    name: 'Casos',
                    data: this.stages.map((s) => s.total_cases),
                },
            ],
            chart: {
                type: 'bar',
                height: 400,
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    distributed: true,
                    barHeight: '70%',
                },
            },
            dataLabels: {
                enabled: true,
                style: { colors: ['#fff'] },
                formatter: (val: number, opts: any) =>
                    `${this.stages[opts.dataPointIndex].stage_name}: ${val}`,
            },
            tooltip: {
                y: { formatter: (val: number) => `${val} casos` },
            },
            title: {
                text: 'Funnel de Conversión',
                align: 'center',
            },
            xaxis: {
                categories: this.stages.map((s) => s.stage_name),
            },
            colors: this.stages.map((s) => s.color_hex || '#16a34a'),
        };
    }
    
}