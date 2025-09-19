import { Injectable } from "@angular/core";
import { returnCompleteURI } from "@app/utils";
import { environment } from "@environment";
import { FetchService } from "./extras/fetch.service";
import { ApiResponse } from "@app/models";
import { Role } from "@app/models/role.model";

const GATEWAY = '/roles';
export const ROLE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private fetchService: FetchService) { }

  async getAll(): Promise<ApiResponse<Role[]>> {
    return await this.fetchService.get<ApiResponse<Role[]>>({ API_Gateway: `${ROLE_URL}` });
  }


  async update(data: any): Promise<ApiResponse<Role[]>> {
    return await this.fetchService.put<ApiResponse<Role[]>>({
      API_Gateway: `${ROLE_URL}`, 
      values: data
    });
  }

  async create(data: any): Promise<ApiResponse<Role[]>> {
    return await this.fetchService.post<ApiResponse<Role[]>>({
      API_Gateway: `${ROLE_URL}`, 
      values: data
    });
  }

  async delete(id: number): Promise<ApiResponse<Role[]>> {
    return await this.fetchService.delete<ApiResponse<Role[]>>({ API_Gateway: `${ROLE_URL}/${id}` });
  }


}