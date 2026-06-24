import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/main-layout.component';
import { RouterLink } from '@angular/router';
import { CaseDashboardService } from '@app/services/case-dashboard.service';
import { AuthService } from '@app/services/auth.service';
import { CompanyService } from '@app/services/company.service';
import { LanguageService } from '@app/services/extras/language.service';
import { User } from '@app/models/auth.model';

@Component({
  selector: 'app-ocr-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MainLayoutComponent
  ],
  templateUrl: './ocr-report.component.html',
  styleUrls: ['./ocr-report.component.css']
})
export class OcrReportComponent implements OnInit {
  user: User | null = null;
  loading = false;

  companies: { company_id: number; company_name: string }[] = [];
  selectedCompanyId: number | null = null;

  // Filter parameters
  startDate = '';
  endDate = '';
  searchQuery = '';
  selectedBank = '';
  selectedMatchStatus = '';

  // Data properties
  summary: any = {
    total_cases: 0,
    ocr_cases: 0,
    ocr_percentage: 0,
    total_ocr_receipts: 0,
    matched_receipts: 0,
    unmatched_receipts: 0
  };
  distribution: any[] = [];
  validations: any[] = [];

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
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
        const storedCompanyId = this.authService.getStoredAuthData()?.company_id;
        const hasStoredCompany = storedCompanyId && this.companies.some(c => c.company_id === storedCompanyId);
        this.selectedCompanyId = hasStoredCompany ? storedCompanyId! : (this.companies[0]?.company_id ?? null);
        
        if (this.selectedCompanyId) {
          await this.loadReportData();
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async onFilterChange(): Promise<void> {
    await this.loadReportData();
  }

  async loadReportData(): Promise<void> {
    if (!this.selectedCompanyId) return;

    this.loading = true;
    try {
      const res = await this.caseDashboardService.getOcrReport(
        this.selectedCompanyId,
        this.startDate,
        this.endDate
      );
      if (res?.success && res.data) {
        this.summary = res.data.summary || {
          total_cases: 0,
          ocr_cases: 0,
          ocr_percentage: 0,
          total_ocr_receipts: 0,
          matched_receipts: 0,
          unmatched_receipts: 0
        };
        this.distribution = res.data.distribution || [];
        this.validations = res.data.validations || [];
      } else {
        this.resetData();
      }
    } catch (error) {
      console.error('Error loading OCR report:', error);
      this.resetData();
    } finally {
      this.loading = false;
    }
  }

  resetData(): void {
    this.summary = {
      total_cases: 0,
      ocr_cases: 0,
      ocr_percentage: 0,
      total_ocr_receipts: 0,
      matched_receipts: 0,
      unmatched_receipts: 0
    };
    this.distribution = [];
    this.validations = [];
  }

  getFilteredValidations(): any[] {
    let filtered = this.validations;

    // Filter by bank
    if (this.selectedBank) {
      filtered = filtered.filter(v => v.bank_name === this.selectedBank);
    }

    // Filter by match status
    if (this.selectedMatchStatus === 'matched') {
      filtered = filtered.filter(v => v.erp_id > 0);
    } else if (this.selectedMatchStatus === 'unmatched') {
      filtered = filtered.filter(v => !v.erp_id);
    }

    // Search query local filter
    if (!this.searchQuery.trim()) return filtered;
    const query = this.searchQuery.toLowerCase().trim();
    return filtered.filter(v => {
      const caseId = String(v.case_id);
      const clientName = (v.client_name || '').toLowerCase();
      const senderName = (v.sender_name || '').toLowerCase();
      const reference = (v.receipt_reference_number || '').toLowerCase();
      const document = (v.client_document || '').toLowerCase();
      return caseId.includes(query) || clientName.includes(query) || senderName.includes(query) || reference.includes(query) || document.includes(query);
    });
  }

  getUniqueBanks(): string[] {
    const banks = new Set<string>();
    this.validations.forEach(v => {
      if (v.bank_name) banks.add(v.bank_name);
    });
    return Array.from(banks).sort();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.searchQuery = '';
    this.selectedBank = '';
    this.selectedMatchStatus = '';
    this.loadReportData();
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
