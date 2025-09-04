import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { Department } from '@app/models/department.model';

const GATEWAY = '/departments';
export const DEPARTMENT_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private fetchService: FetchService) {}

  /**
   * @description Obtener departamentos por compañía (company_id)
   */
  async getByCompany(companyId: number): Promise<ApiResponse<Department[]>> {
    return await this.fetchService.get<ApiResponse<Department[]>>({
      API_Gateway: `${DEPARTMENT_URL}/company/${companyId}`,
    });
  }

  /**
   * @description (Opcional) Obtener un departamento por ID
   */
  async getById(id: number): Promise<ApiResponse<Department>> {
    return await this.fetchService.get<ApiResponse<Department>>({
      API_Gateway: `${DEPARTMENT_URL}/${id}`,
    });
  }

  /**
   * @description Crear departamento
   * @note Debe incluir company_id en el payload
   */
  async createDepartment(data: Partial<Department>): Promise<ApiResponse<Department>> {
    return await this.fetchService.post<ApiResponse<Department>>({
      API_Gateway: `${DEPARTMENT_URL}`,
      values: data,
    });
  }

  /**
   * @description Actualizar departamento
   */
  async updateDepartment(id: number, data: Partial<Department>): Promise<ApiResponse<Department>> {
    // Aseguramos que el ID esté presente en los datos (como en CompanyService)
    data.id = id;

    return await this.fetchService.put<ApiResponse<Department>>({
      API_Gateway: `${DEPARTMENT_URL}`,
      values: data,
    });
  }

  /**
   * @description Eliminar departamento por ID
   */
  async deleteDepartment(id: number): Promise<ApiResponse<void>> {
    return await this.fetchService.delete<ApiResponse<void>>({
      API_Gateway: `${DEPARTMENT_URL}/${id}`,
    });
  }
}