import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environment';
import { UnreconciledPayment } from '../models/unreconciled-payment.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UnreconciledPaymentService {
    private apiUrl = `${environment.API.BASE}/unreconciled-payments`;

    constructor(private http: HttpClient) { }

    async getUnreconciledPayments(
        startDate?: string,
        endDate?: string
    ): Promise<{ success: boolean; message?: string; data?: UnreconciledPayment[]; error?: any }> {
        const params: any = {};
        if (startDate) params['start_date'] = startDate;
        if (endDate) params['end_date'] = endDate;

        try {
            const response = await firstValueFrom(
                this.http.get<{ success: boolean; message?: string; data?: UnreconciledPayment[]; error?: any }>(
                    this.apiUrl,
                    { params }
                )
            );
            return response;
        } catch (error) {
            console.error('Error fetching unreconciled payments:', error);
            return { success: false, error };
        }
    }
}
