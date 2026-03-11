import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { PaymentValidationService } from '@app/services/payment-validation.service';
import { PaymentValidation } from '@app/models/payment-validation.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-payment-validations',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './payment-validations.html',
  styleUrl: './payment-validations.css'
})
export class PaymentValidationsComponent implements OnInit {
  paymentValidations: PaymentValidation[] = [];
  isLoading = false;

  // Filters
  startDate: string = '';
  endDate: string = '';
  caseId: number | null = null;
  contractId: number | null = null;

  // Modal State
  isReceiptModalOpen = false;
  currentReceiptBase64: string | SafeResourceUrl | null = null;
  isLoadingReceipt = false;
  isPdf = false;

  constructor(private pvService: PaymentValidationService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const resp = await this.pvService.getPaymentValidations(
        this.startDate || undefined,
        this.endDate || undefined,
        this.caseId || undefined,
        this.contractId || undefined
      );

      if (resp && resp.success && resp.data) {
        this.paymentValidations = resp.data;
      } else {
        this.paymentValidations = [];
      }
    } catch (error) {
      console.error('Error fetching payment validations', error);
      this.paymentValidations = [];
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    this.loadData();
  }

  clearFilters() {
    this.startDate = '';
    this.endDate = '';
    this.caseId = null;
    this.contractId = null;
    this.contractId = null;
    this.loadData();
  }

  async viewReceipt(erpId: number) {
    if (!erpId) return;

    this.isReceiptModalOpen = true;
    this.isLoadingReceipt = true;
    this.currentReceiptBase64 = null;

    try {
      const resp = await this.pvService.getReceiptImage(erpId);
      if (resp && resp.success && resp.data && resp.data.receipt_base64) {
        let b64 = resp.data.receipt_base64;

        // JVBER is the standard Base64 encoding for "%PDF-"
        if (b64.startsWith('JVBER')) {
          this.isPdf = true;
          this.currentReceiptBase64 = this.sanitizer.bypassSecurityTrustResourceUrl(
            'data:application/pdf;base64,' + b64
          );
        } else {
          if (!b64.startsWith('data:')) {
            b64 = 'data:image/jpeg;base64,' + b64;
          }
          this.currentReceiptBase64 = b64;
        }
      } else {
        console.warn('Receipt image not found or empty');
      }
    } catch (e) {
      console.error('Error loading receipt image', e);
    } finally {
      this.isLoadingReceipt = false;
    }
  }

  closeReceiptModal() {
    this.isReceiptModalOpen = false;
    this.currentReceiptBase64 = null;
    this.isPdf = false;
  }
}
