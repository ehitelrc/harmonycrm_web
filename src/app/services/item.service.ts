import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { Item } from '@app/models/item.model';

const GATEWAY = '/items';
export const ITEM_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class ItemService {
  constructor(private fetch: FetchService) {}

 
  // Por compañía (recomendado)
  async getByCompany(companyId: number): Promise<ApiResponse<Item[]>> {
    return await this.fetch.get<ApiResponse<Item[]>>({
      API_Gateway: `${ITEM_URL}/company/${companyId}`,
    });
  }

  async getById(id: number): Promise<ApiResponse<Item>> {
    return await this.fetch.get<ApiResponse<Item>>({ API_Gateway: `${ITEM_URL}/${id}` });
  }

  async create(payload: Partial<Item>): Promise<ApiResponse<Item>> {
    return await this.fetch.post<ApiResponse<Item>>({
      API_Gateway: `${ITEM_URL}`,
      values: payload,
    });
  }

  async update(id: number, payload: Partial<Item>): Promise<ApiResponse<Item>> {
    payload.id = id;
    return await this.fetch.put<ApiResponse<Item>>({
      API_Gateway: `${ITEM_URL}`,
      values: payload,
    });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${ITEM_URL}/${id}`,
    });
  }
}