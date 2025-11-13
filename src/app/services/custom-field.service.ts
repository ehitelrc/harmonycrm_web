import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';

const GATEWAY = '/custom-fields';
export const CUSTOM_LIST_URL = returnCompleteURI({
    URI: environment.API.BASE,
    API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class CustomFieldService {
    private baseUrl = '/api/custom-fields';

    constructor(private fetchService: FetchService) { }




    async createValue(data: { list_id: number, code_value: string, description_value: string }): Promise<ApiResponse<any>> {
        return await this.fetchService.post<ApiResponse<any>>({
            API_Gateway: `${CUSTOM_LIST_URL}/value`,
            values: data,
        });
    }

    async SaveCustomFieldsValues(payload: any): Promise<ApiResponse<any>> {
        return await this.fetchService.post<ApiResponse<any>>({
            API_Gateway: `${CUSTOM_LIST_URL}/entity/value`,
            values: payload,
        });
    }




}