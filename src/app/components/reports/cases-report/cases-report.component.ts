import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { CaseDashboardService } from '@app/services/case-dashboard.service';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { DepartmentService } from '@app/services/department.service';
import { LanguageService } from '@app/services/extras/language.service';
import { User } from '@app/models/auth.model';
import { DashboardStats, CaseChannelStat, CaseAgentStat, OldestOpenCase } from '@app/models/dashboard-stats.model';
import { Department } from '@app/models/department.model';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-cases-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MainLayoutComponent,
    NgApexchartsModule
  ],
  templateUrl: './cases-report.component.html',
  styleUrls: ['./cases-report.component.css']
})
export class CasesReportComponent implements OnInit {
  user: User | null = null;
  loading = false;
  stats: DashboardStats | null = null;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  departments: Department[] = [];
  selectedDepartmentId: number | null = null;

  // Search and Sort properties for Agent table
  agentSearch = '';
  oldestSearch = '';
  agentSortColumn = 'total'; // 'name', 'open', 'closed', 'total', 'avg_time'
  agentSortAsc = false;

  // ApexCharts Configs
  channelChartOptions: Partial<ApexOptions> = {};
  agentChartOptions: Partial<ApexOptions> = {};

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private caseDashboardService: CaseDashboardService,
    private languageService: LanguageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getCurrentUser();
    if (!this.user) return;

    await this.loadCompanies();
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getCompaniesByUserId(this.user!.user_id);
      if (response?.success && response.data) {
        this.companies = response.data;
        this.selectedCompanyId = this.companies[0]?.company_id ?? null;
        if (this.selectedCompanyId) {
          await this.loadDepartments();
          await this.loadStats();
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async loadDepartments(): Promise<void> {
    if (!this.selectedCompanyId) {
      this.departments = [];
      return;
    }
    try {
      const response = await this.departmentService.getByCompany(this.selectedCompanyId);
      if (response?.success && response.data) {
        this.departments = response.data;
      } else {
        this.departments = [];
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      this.departments = [];
    }
  }

  async onCompanyChange(): Promise<void> {
    this.selectedDepartmentId = null;
    await this.loadDepartments();
    await this.loadStats();
  }

  async onFilterChange(): Promise<void> {
    await this.loadStats();
  }

  async loadStats(): Promise<void> {
    if (!this.selectedCompanyId) return;

    this.loading = true;
    try {
      let res;
      if (this.selectedDepartmentId) {
        res = await this.caseDashboardService.getByCompanyAndDepartmentID(
          this.selectedCompanyId,
          this.selectedDepartmentId
        );
      } else {
        res = await this.caseDashboardService.getByCompanyID(this.selectedCompanyId);
      }

      if (res?.success && res.data) {
        this.stats = res.data;
        this.buildCharts();
      } else {
        this.stats = null;
      }
    } catch (error) {
      console.error('Error loading case dashboard stats:', error);
      this.stats = null;
    } finally {
      this.loading = false;
    }
  }

  // Sorting logic for Agents Table
  getFilteredAndSortedAgents(): CaseAgentStat[] {
    if (!this.stats?.cases_by_agent) return [];
    
    // Filter
    let agents = [...this.stats.cases_by_agent];
    if (this.agentSearch.trim()) {
      const search = this.agentSearch.toLowerCase();
      agents = agents.filter(a => a.agent_name?.toLowerCase().includes(search));
    }

    // Sort
    agents.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const nameA = a.agent_name || '';
      const nameB = b.agent_name || '';
      const openA = a.open_cases || 0;
      const openB = b.open_cases || 0;
      const closedA = a.closed_cases || 0;
      const closedB = b.closed_cases || 0;
      const totalA = openA + closedA;
      const totalB = openB + closedB;
      const avgA = a.avg_close_hours || 0;
      const avgB = b.avg_close_hours || 0;

      switch (this.agentSortColumn) {
        case 'name':
          return this.agentSortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        case 'open':
          valA = openA;
          valB = openB;
          break;
        case 'closed':
          valA = closedA;
          valB = closedB;
          break;
        case 'avg_time':
          valA = avgA;
          valB = avgB;
          break;
        case 'total':
        default:
          valA = totalA;
          valB = totalB;
          break;
      }

      if (valA < valB) return this.agentSortAsc ? -1 : 1;
      if (valA > valB) return this.agentSortAsc ? 1 : -1;
      return 0;
    });

    return agents;
  }

  getFilteredOldestOpenCases(): OldestOpenCase[] {
    if (!this.stats?.oldest_open_cases) return [];
    if (!this.oldestSearch.trim()) return this.stats.oldest_open_cases;

    const query = this.oldestSearch.toLowerCase().trim();
    return this.stats.oldest_open_cases.filter(c => {
      const name = (c.client_name || '').toLowerCase();
      const id = String(c.case_id);
      const phone = (c.client_phone || '').toLowerCase();
      return name.includes(query) || id.includes(query) || phone.includes(query);
    });
  }

  setAgentSort(column: string): void {
    if (this.agentSortColumn === column) {
      this.agentSortAsc = !this.agentSortAsc;
    } else {
      this.agentSortColumn = column;
      this.agentSortAsc = false;
    }
  }

  // Chart builders
  buildCharts(): void {
    if (!this.stats) return;

    // 1. Channel Chart (Donut)
    const channelNames = (this.stats.cases_by_channel || []).map(
      c => c.channel_name || 'Desconocido'
    );
    const channelTotals = (this.stats.cases_by_channel || []).map(
      c => (c.open_cases || 0) + (c.closed_cases || 0)
    );

    this.channelChartOptions = {
      series: channelTotals,
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Inter, sans-serif'
      },
      labels: channelNames,
      colors: ['#3e66ea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`
      },
      legend: {
        position: 'bottom',
        fontSize: '12px'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => {
                  const total = channelTotals.reduce((a, b) => a + b, 0);
                  return String(total);
                }
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} Casos`
        }
      }
    };

    // 2. Agent Chart (Stacked/Grouped Bars)
    const agents = (this.stats.cases_by_agent || []).slice(0, 10); // Limit to top 10 agents for display
    const agentNames = agents.map(a => (a.agent_name || 'Desconocido').toUpperCase());
    const agentOpenCases = agents.map(a => a.open_cases || 0);
    const agentClosedCases = agents.map(a => a.closed_cases || 0);

    this.agentChartOptions = {
      series: [
        { name: 'Abiertos', data: agentOpenCases },
        { name: 'Cerrados', data: agentClosedCases }
      ],
      chart: {
        type: 'bar',
        height: 300,
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 4
        }
      },
      colors: ['#3e66ea', '#10b981'],
      xaxis: {
        categories: agentNames,
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '11px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '11px'
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px'
      },
      grid: {
        borderColor: '#f1f5f9',
        xaxis: { lines: { show: true } }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} Casos`
        }
      }
    };
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  // Format hours into readable format (e.g. 2.5h -> "2h 30m" or "1d 2h")
  formatAvgHours(hours: number | null | undefined): string {
    if (hours === null || hours === undefined || hours === 0) return 'N/D';
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}
