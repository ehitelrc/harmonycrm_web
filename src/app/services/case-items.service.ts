import { Injectable } from '@angular/core';
 
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
 
import { VwCaseItemsDetail } from '@app/models/vw-case-items-detail.model';
import { ApiResponse } from '@app/models';
import { CaseItem, CaseItemRequest } from '@app/models/case-item.model';

const GATEWAY = '/case-items';
export const CASE_ITEM_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class CaseItemService {
  constructor(private fetch: FetchService) {}

  /**
   * Obtiene todos los ítems de un caso (vista vw_case_items_detail)
   * @param caseId ID del caso
   */
  async getByCaseId(caseId: number): Promise<ApiResponse<VwCaseItemsDetail[]>> {
    return await this.fetch.get<ApiResponse<VwCaseItemsDetail[]>>({
      API_Gateway: `${CASE_ITEM_URL}/case/${caseId}`,
    });
  }

  /**
   * Obtiene un ítem específico del caso por su ID
   * @param id ID del registro en case_items
   */
  async getById(id: number): Promise<ApiResponse<CaseItem>> {
    return await this.fetch.get<ApiResponse<CaseItem>>({
      API_Gateway: `${CASE_ITEM_URL}/${id}`,
    });
  }

  /**
   * Crea un nuevo registro de ítem en un caso
   * @param payload Datos del CaseItemRequest
   */
  async create(payload: CaseItemRequest): Promise<ApiResponse<CaseItem>> {
    return await this.fetch.post<ApiResponse<CaseItem>>({
      API_Gateway: `${CASE_ITEM_URL}`,
      values: payload,
    });
  }

  /**
   * Actualiza un registro de ítem en un caso
   * @param payload Datos del CaseItemRequest
   */
  async update(payload: CaseItemRequest): Promise<ApiResponse<CaseItem>> {
    return await this.fetch.put<ApiResponse<CaseItem>>({
      API_Gateway: `${CASE_ITEM_URL}`,
      values: payload,
    });
  }

  /**
   * Elimina un ítem del caso
   * @param id ID del registro a eliminar
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${CASE_ITEM_URL}/${id}`,
    });
  }
}