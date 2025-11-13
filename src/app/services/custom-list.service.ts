import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';

const GATEWAY = '/custom-lists';
export const CUSTOM_LIST_URL = returnCompleteURI({
    URI: environment.API.BASE,
    API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class CustomListService {
    private baseUrl = '/api/custom-lists';

    constructor(private fetchService: FetchService) { }


    //{{base_url}}/custom-lists/clients/41 
    async getListsForEntity(entityName: string, entityId: number): Promise<ApiResponse<CustomListService[]>> {
        return await this.fetchService.get<ApiResponse<CustomListService[]>>({
            API_Gateway: `${CUSTOM_LIST_URL}/clients/${entityId}`,
        });
    }

    /**
     * Guarda el valor seleccionado de una lista para una entidad específica
     */
    async saveEntityValue(payload: {
        entity_name: string;
        entity_id: number;
        list_id: number;
        value_id: number | null;
    }): Promise<ApiResponse<any>> {

        const correctedPayload = {
            entity_name: payload.entity_name,
            entity_id: payload.entity_id,
            list_id: payload.list_id,
            list_value: payload.value_id   // ⭐ CORREGIDO
        };

        return await this.fetchService.post<ApiResponse<any>>({
            API_Gateway: `${CUSTOM_LIST_URL}/select`,
            values: correctedPayload,
        });
    }

    // {{base_url}}/custom-lists/list
    async getAllList(): Promise<ApiResponse<CustomListService[]>> {
        return await this.fetchService.get<ApiResponse<CustomListService[]>>({
            API_Gateway: `${CUSTOM_LIST_URL}/list`,
        });
    }

    async updateValue(data: { id: number, list_id: number, code_value: string, description_value: string }): Promise<ApiResponse<any>> {
        return await this.fetchService.put<ApiResponse<any>>({
            API_Gateway: `${CUSTOM_LIST_URL}/value`,
            values: data,
        });
    }

    async createValue(data: { list_id: number, code_value: string, description_value: string }): Promise<ApiResponse<any>> {
        return await this.fetchService.post<ApiResponse<any>>({
            API_Gateway: `${CUSTOM_LIST_URL}/values`,
            values: data,
        });
    }

}