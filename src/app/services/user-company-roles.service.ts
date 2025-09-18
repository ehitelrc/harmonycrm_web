// src/app/services/user-company.service.ts
import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { UserRoleCompanyManage } from '@app/models/companies_user_view';
 

const GATEWAY = '/user-company-roles';
export const USER_COMPANY_ROLES_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class UserCompanyRolesService {
  constructor(private fetch: FetchService) {}

  /**
   * Obtener los roles de un usuario en una compañía
   * GET /user-company-roles/user/:userId/company/:companyId
   */
  getRolesByUserAndCompany(userId: number, companyId: number) {
    return this.fetch.get<ApiResponse<UserRoleCompanyManage[]>>({
      API_Gateway: `${USER_COMPANY_ROLES_URL}/user/${userId}/company/${companyId}`,
    });
  }

  /**
   * Guardar asignación de roles
   * POST /user-company-roles/assign
   * (El backend debe recibir user_id, company_id, role_id, has_role)
   */
  saveAssignments(payload: UserRoleCompanyManage[]) {
    return this.fetch.post<ApiResponse<void>>({
      API_Gateway: `${USER_COMPANY_ROLES_URL}/assign`,
      values: payload,
    });
  }

   async batchUpdate(payload: UserRoleCompanyManage[]): Promise<ApiResponse<void>> {
    return await this.fetch.put<ApiResponse<void>>({
      API_Gateway: `${USER_COMPANY_ROLES_URL}/batch`,
      values: payload,
    });
  }
}