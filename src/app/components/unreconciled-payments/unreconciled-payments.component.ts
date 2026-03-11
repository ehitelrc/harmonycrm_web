import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { UnreconciledPaymentService } from '@app/services/unreconciled-payment.service';
import { UnreconciledPayment } from '@app/models/unreconciled-payment.model';

@Component({
    selector: 'app-unreconciled-payments',
    standalone: true,
    imports: [CommonModule, FormsModule, MainLayoutComponent],
    templateUrl: './unreconciled-payments.component.html',
    styleUrl: './unreconciled-payments.component.css'
})
export class UnreconciledPaymentsComponent implements OnInit {
    payments: UnreconciledPayment[] = [];
    isLoading = false;

    // Filters
    startDate: string = '';
    endDate: string = '';

    get kpiMostrados(): number {
        return this.payments.length;
    }

    constructor(private upService: UnreconciledPaymentService) { }

    ngOnInit(): void {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        try {
            const resp = await this.upService.getUnreconciledPayments(
                this.startDate || undefined,
                this.endDate || undefined
            );

            if (resp && resp.success && resp.data) {
                this.payments = resp.data;
            } else {
                this.payments = [];
            }
        } catch (error) {
            console.error('Error in unreconciled payments reload:', error);
            this.payments = [];
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
        this.loadData();
    }
}
