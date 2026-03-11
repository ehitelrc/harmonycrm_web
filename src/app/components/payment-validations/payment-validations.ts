import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { PaymentValidationService } from '@app/services/payment-validation.service';
import { CaseService } from '@app/services/case.service';
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

  // Image Carousel State
  isImageCarouselOpen = false;
  isLoadingImages = false;
  carouselImages: { url: string | SafeResourceUrl, isPdf: boolean }[] = [];
  currentImageIndex = 0;

  // KPI Filter State
  activeKpiFilter: string | null = null;

  get filteredPaymentValidations(): PaymentValidation[] {
    if (!this.activeKpiFilter) return this.paymentValidations;

    switch (this.activeKpiFilter) {
      case 'enviados':
        return this.paymentValidations.filter(v => v.harmony_state === 'enviado_al_cliente');
      case 'cerrados':
        return this.paymentValidations.filter(v => v.harmony_state === 'caso_cerrado');
      case 'exitosos':
        return this.paymentValidations.filter(v => v.harmony_state === 'enviado_al_cliente' || v.harmony_state === 'caso_cerrado');
      case 'sin_erp':
        return this.paymentValidations.filter(v => !v.erp_reference_number);
      case 'error_notificar':
        return this.paymentValidations.filter(v => v.harmony_state === 'error_al_notificar');
      case 'otros':
        return this.paymentValidations.filter(v =>
          v.harmony_state !== 'enviado_al_cliente' &&
          v.harmony_state !== 'caso_cerrado' &&
          v.harmony_state !== 'error_al_notificar' &&
          !!v.erp_reference_number
        );
      default:
        return this.paymentValidations;
    }
  }

  toggleKpiFilter(filter: string | null) {
    if (this.activeKpiFilter === filter || filter === null) {
      this.activeKpiFilter = null; // Toggle off or clear
    } else {
      this.activeKpiFilter = filter; // Toggle on
    }
  }

  // KPIs
  get kpiMostrados(): number {
    return this.paymentValidations.length;
  }

  get kpiEnviados(): number {
    return this.paymentValidations.filter(v => v.harmony_state === 'enviado_al_cliente').length;
  }

  get kpiCerrados(): number {
    return this.paymentValidations.filter(v => v.harmony_state === 'caso_cerrado').length;
  }

  get kpiExitosos(): number {
    return this.kpiEnviados + this.kpiCerrados;
  }

  get kpiSinErp(): number {
    return this.paymentValidations.filter(v => !v.erp_reference_number).length;
  }

  get kpiErrorNotificar(): number {
    return this.paymentValidations.filter(v => v.harmony_state === 'error_al_notificar').length;
  }

  get kpiOtros(): number {
    return this.paymentValidations.filter(v =>
      v.harmony_state !== 'enviado_al_cliente' &&
      v.harmony_state !== 'caso_cerrado' &&
      v.harmony_state !== 'error_al_notificar' &&
      !!v.erp_reference_number
    ).length;
  }

  get kpiExitososPorcentaje(): number {
    const total = this.kpiMostrados;
    return total === 0 ? 0 : (this.kpiExitosos / total) * 100;
  }

  get kpiSinErpPorcentaje(): number {
    const total = this.kpiMostrados;
    return total === 0 ? 0 : (this.kpiSinErp / total) * 100;
  }

  get kpiErrorNotificarPorcentaje(): number {
    const total = this.kpiMostrados;
    return total === 0 ? 0 : (this.kpiErrorNotificar / total) * 100;
  }

  get kpiOtrosPorcentaje(): number {
    const total = this.kpiMostrados;
    return total === 0 ? 0 : (this.kpiOtros / total) * 100;
  }

  constructor(
    private pvService: PaymentValidationService,
    private caseService: CaseService,
    private sanitizer: DomSanitizer
  ) { }

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

  // Carousel Logic ////////////////////

  viewImages(caseId: number) {
    if (!caseId) return;

    this.isImageCarouselOpen = true;
    this.isLoadingImages = true;
    this.carouselImages = [];
    this.currentImageIndex = 0;

    this.caseService.getClientImages(caseId).then(messages => {
      if (messages && messages.length > 0) {
        this.carouselImages = messages.filter(m => m.base64_content).map(m => {
          let b64 = m.base64_content!;
          let isPdf = false;
          let url: string | SafeResourceUrl = '';

          if (b64.startsWith('JVBER')) {
            isPdf = true;
            url = this.sanitizer.bypassSecurityTrustResourceUrl('data:application/pdf;base64,' + b64);
          } else {
            if (!b64.startsWith('data:')) {
              b64 = 'data:image/jpeg;base64,' + b64;
            }
            url = b64;
          }
          return { url, isPdf };
        });
      }
      this.isLoadingImages = false;
    }).catch(err => {
      console.error('Error loading client images', err);
      this.isLoadingImages = false;
    });
  }

  closeImageCarousel() {
    this.isImageCarouselOpen = false;
    this.carouselImages = [];
    this.currentImageIndex = 0;
  }

  nextImage() {
    if (this.currentImageIndex < this.carouselImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

}
