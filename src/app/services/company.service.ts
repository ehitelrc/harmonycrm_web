import { Injectable } from "@angular/core";
import { returnCompleteURI } from "@app/utils";
import { environment } from "@environment";
import { FetchService } from "./extras/fetch.service";
import { ApiResponse } from "@app/models";
import { Company } from "@app/models/company.model";
import { CompanyUser } from "@app/models/companies_user_view";

const GATEWAY = '/companies';
export const COMPANY_URL = returnCompleteURI({
    URI: environment.API.BASE,
    API_Gateway: GATEWAY,
});

@Injectable({
    providedIn: 'root',
})
export class CompanyService {
    constructor(private fetchService: FetchService) { }


    /**
   * @description Get all locations
   */
    async getAllCompanies(): Promise<ApiResponse<Company[]>> {
        return await this.fetchService.get<ApiResponse<Company[]>>({
            API_Gateway: `${COMPANY_URL}`,
        });
    }


    async getCompanyById(id:number) : Promise<ApiResponse<Company>> {
        return await this.fetchService.get<ApiResponse<Company>>({
            API_Gateway: `${COMPANY_URL}/${id}`,
        });
    }

    async getCompaniesByUserId(userId: number): Promise<ApiResponse<CompanyUser[]>> {
        return await this.fetchService.get<ApiResponse<CompanyUser[]>>({
            API_Gateway: `${COMPANY_URL}/user/${userId}`,
        });
    }

    async deleteCompany(id: number): Promise<ApiResponse<void>> {
        return await this.fetchService.delete<ApiResponse<void>>({
            API_Gateway: `${COMPANY_URL}/${id}`,
        });
    }

    async updateCompany(id: number, data: Partial<Company>): Promise<ApiResponse<Company>> {
        console.log(data);

        data.id = id; // Aseguramos que el ID esté presente en los datos
        
        return await this.fetchService.put<ApiResponse<Company>>({
            API_Gateway: `${COMPANY_URL}`,
            values: data
        });
    }

    async createCompany(data: Partial<Company>): Promise<ApiResponse<Company>> {
        return await this.fetchService.post<ApiResponse<Company>>({
            API_Gateway: `${COMPANY_URL}`,
            values: data
        });
    }
}