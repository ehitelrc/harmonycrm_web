import { Injectable } from "@angular/core";
import { returnCompleteURI } from "@app/utils";
import { environment } from "@environment";
import { FetchService } from "./extras/fetch.service";
import { ApiResponse } from "@app/models";
import { Role } from "@app/models/role.model";
import { RolePermissionView } from "@app/models/role_permissions_view.model";

const GATEWAY = '/roles';
export const ROLE_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

const GATEWAY_PERMISSIONS_ROLE = '/role-permissions';
export const ROLE_PERMISSIONS_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY_PERMISSIONS_ROLE,
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

  async getPermissionsByRoleId(id: number): Promise<ApiResponse<RolePermissionView[]>> {
    return await this.fetchService.get<ApiResponse<RolePermissionView[]>>({ API_Gateway: `${ROLE_PERMISSIONS_URL}/view/role/${id}` });
  }


  async updateRolePermissions(payload: { role_id: number; permission_id: number }[]): Promise<ApiResponse<any>> {
    return await this.fetchService.post<ApiResponse<any>>({
      API_Gateway: `${ROLE_PERMISSIONS_URL}`, // sin roleId en la ruta
      values: payload
    });
  }

}