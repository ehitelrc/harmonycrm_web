import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { PaymentValidation } from '@app/models/payment-validation.model';

const GATEWAY = '/payment-validations';
export const PV_URL = returnCompleteURI({
    URI: environment.API.BASE,
    API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class PaymentValidationService {
    constructor(private fetch: FetchService) { }

    getPaymentValidations(startDate?: string, endDate?: string, caseId?: number, contractId?: number) {
        let params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (caseId) params.append('case_id', caseId.toString());
        if (contractId) params.append('contract_id', contractId.toString());

        const queryString = params.toString();
        const endpoint = queryString ? `${PV_URL}?${queryString}` : `${PV_URL}`;

        return this.fetch.get<ApiResponse<PaymentValidation[]>>({
            API_Gateway: endpoint,
        });
    }

    getReceiptImage(erpId: number) {
        return this.fetch.get<ApiResponse<{ receipt_base64: string }>>({
            API_Gateway: `${PV_URL}/receipt/${erpId}`,
        });
    }
}
