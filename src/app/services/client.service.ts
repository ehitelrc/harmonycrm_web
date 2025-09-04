import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { Client } from '@app/models/client.model';

const GATEWAY = '/clients';
export const CLIENT_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private fetch: FetchService) {}

  async getAll(): Promise<ApiResponse<Client[]>> {
    return await this.fetch.get<ApiResponse<Client[]>>({ API_Gateway: `${CLIENT_URL}` });
  }

  async getById(id: number): Promise<ApiResponse<Client>> {
    return await this.fetch.get<ApiResponse<Client>>({ API_Gateway: `${CLIENT_URL}/${id}` });
  }

  async create(data: Partial<Client>): Promise<ApiResponse<Client>> {
    return await this.fetch.post<ApiResponse<Client>>({ API_Gateway: `${CLIENT_URL}`, values: data });
  }

  async update(id: number, data: Partial<Client>): Promise<ApiResponse<Client>> {
    data.id = id;
    return await this.fetch.put<ApiResponse<Client>>({ API_Gateway: `${CLIENT_URL}`, values: data });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({ API_Gateway: `${CLIENT_URL}/${id}` });
  }
}