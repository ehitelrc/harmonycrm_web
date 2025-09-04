import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { Funnel } from '@app/models/funnel.model';

const GATEWAY = '/funnels';
export const FUNNEL_URL = returnCompleteURI({
    URI: environment.API.BASE,
    API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class FunnelService {
    constructor(private fetch: FetchService) { }

    async getAll(): Promise<ApiResponse<Funnel[]>> {
        return await this.fetch.get<ApiResponse<Funnel[]>>({
            API_Gateway: `${FUNNEL_URL}`,
        });
    }

    async getById(id: number): Promise<ApiResponse<Funnel>> {
        return await this.fetch.get<ApiResponse<Funnel>>({
            API_Gateway: `${FUNNEL_URL}/${id}`,
        });
    }

    async create(data: Partial<Funnel>): Promise<ApiResponse<Funnel>> {
        console.log(data);


        return await this.fetch.post<ApiResponse<Funnel>>({
            API_Gateway: `${FUNNEL_URL}/`,
            values: data,
        });
    }

    async update(data: Partial<Funnel>) {
        // ⬅️ Debe llegar con data.id
        return await this.fetch.put<ApiResponse<Funnel>>({
            API_Gateway: `${FUNNEL_URL}/`,        // SIN /:id
            values: data,                        // { id, name, description, is_active }
        });
    }

    async delete(id: number): Promise<ApiResponse<void>> {
        return await this.fetch.delete<ApiResponse<void>>({
            API_Gateway: `${FUNNEL_URL}/${id}`,
        });
    }

    // funnel.service.ts (solo los métodos de stages)
    async getStages(funnelId: number) {
        return await this.fetch.get<ApiResponse<any[]>>({
            API_Gateway: `${FUNNEL_URL}/${funnelId}/stages`,
        });
    }

    async createStage(funnelId: number, data: any) {
        data.funnel_id = funnelId; // Asegurarse de incluir el funnel_id
        // API: POST /funnels/:id/stages con body de la etapa
        return await this.fetch.post<ApiResponse<any>>({
            API_Gateway: `${FUNNEL_URL}/stages`,
            values: data,
        });
    }

    async updateStage(data: any) {
        // API espera objeto con id en body (sin :id en URL), tal como en funnels Update
        return await this.fetch.put<ApiResponse<any>>({
            API_Gateway: `${FUNNEL_URL}/stages`,
            values: data, // { id, funnel_id, name, position, is_won, is_lost, ... }
        });
    }

    async deleteStage(stageId: number) {
        // API: DELETE /funnels/stages/:stage_id (según tu controller)
        return await this.fetch.delete<ApiResponse<void>>({
            API_Gateway: `${FUNNEL_URL}/stages/${stageId}`,
        });
    }
}