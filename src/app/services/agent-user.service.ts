import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { User } from '@app/models/user.model';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { AgentUser } from '@app/models/agent_user.models';
import { AgentDepartmentAssignment } from '@app/models/agent_department_assignment_view';

const GATEWAY = '/agents';
export const USER_URL = returnCompleteURI({
	URI: environment.API.BASE,
	API_Gateway: GATEWAY,
});

export const DEPARTMENT_ASSIGNMENTS_URL = returnCompleteURI({
	URI: environment.API.BASE,
	API_Gateway: '/agent-department-assignments',
});

@Injectable({
	providedIn: 'root',
})
export class AgentUserService {
	constructor(private fetchService: FetchService) { }

	/**
	 * @description Get all users
	 * @returns Promise<ApiResponse<User[]>>
	 */
	async getAll(): Promise<ApiResponse<AgentUser[]>> {
		return await this.fetchService.get<ApiResponse<AgentUser[]>>({
			API_Gateway: `${USER_URL}/agents-with-user-info`,
		});
	}

	async getAllNonAgents(): Promise<ApiResponse<AgentUser[]>> {
		return await this.fetchService.get<ApiResponse<AgentUser[]>>({
			API_Gateway: `${USER_URL}/non-agents`,
		});
	}

	/**
	 * @description Get user by ID
	 * @param id User ID
	 * @returns Promise<ApiResponse<User>>
	 */
	async getById(id: string): Promise<ApiResponse<User>> {
		return await this.fetchService.get<ApiResponse<User>>({
			API_Gateway: `${USER_URL}/${id}`,
		});
	}

	/**
	 * @description Create new user
	 * @param user User data
	 * @returns Promise<ApiResponse<any>>
	 */
	async create(user_id: number): Promise<ApiResponse<any>> {
		return await this.fetchService.post<ApiResponse<any>>({
			API_Gateway: `${USER_URL}`,
			values: { user_id: user_id },
		});
	}

	/**
	 * @description Update user by ID
	 * @param id User ID
	 * @param data Partial user data
	 * @returns Promise<ApiResponse<any>>
	 */
	async update(id: number, data: Partial<User>): Promise<ApiResponse<any>> {
		return await this.fetchService.put<ApiResponse<any>>({
			API_Gateway: `${USER_URL}`,
			values: data,
		});
	}

	/**
	 * @description Delete user by ID
	 * @param id User ID
	 * @returns Promise<ApiResponse<any>>
	 */
	async delete(id: number): Promise<ApiResponse<any>> {
		return await this.fetchService.delete<ApiResponse<any>>({
			API_Gateway: `${USER_URL}/${id}`,
		});
	}

	/**
	 * @description Update user password
	 * @param id User ID
	 * @param newPassword New password
	 * @returns Promise<ApiResponse<any>>
	 */
	async updatePassword(id: number, newPassword: string): Promise<ApiResponse<any>> {

		const data: any = { new_password: newPassword };

		return await this.fetchService.put<ApiResponse<any>>({
			API_Gateway: `${USER_URL}/${id}/password`,
			values: data,
		});
	}

	/**
	 * @description Import users from file
	 * @param file File to import
	 * @returns Promise<ApiResponse<any>>
	 */
	async importFile(file: File): Promise<ApiResponse<any>> {
		const formData = new FormData();
		formData.append('file', file);

		return await this.fetchService.post<ApiResponse<any>>({
			API_Gateway: `${USER_URL}/import`,
			values: formData,
		});
	}


	/**
	 * @description Export users to file
	 * @param format Export format (csv or xlsx)
	 * @returns Promise<Blob>
	 */
	async exportFile(format: string = 'xlsx'): Promise<Blob> {
		return await this.fetchService.download({
			API_Gateway: `${USER_URL}/export/?format=${format}`,
		});
	}

	/**
	 * @description Get assigned agents to companies' departments
	 * @param format Export format (csv or xlsx)
	 * @returns Promise<AgentDepartmentAssignment[]>
	 */

	async companiesDepartments(company_id: number, user_id: number): Promise<ApiResponse<AgentDepartmentAssignment[]>> {
	 
		return await this.fetchService.get<ApiResponse<AgentDepartmentAssignment[]>>({
			API_Gateway: `${DEPARTMENT_ASSIGNMENTS_URL}/company/${company_id}/agent/${user_id}`,
		});
	}

	async updateAssignments(user_id: number, company_id: number, assignments: AgentDepartmentAssignment[]): Promise<ApiResponse<any>> {
		const url = `${DEPARTMENT_ASSIGNMENTS_URL}/company/${company_id}/agent/${user_id}`;
		return await this.fetchService.post<ApiResponse<any>>({
			API_Gateway: url,
			values: assignments
		});
	}

	///agent-department-assignments/company/1/department/3
	// By company and department
	async getByCompanyAndDepartment(company_id: number, department_id: number): Promise<ApiResponse<AgentDepartmentAssignment[]>> {
		return await this.fetchService.get<ApiResponse<AgentDepartmentAssignment[]>>({
			API_Gateway: `${DEPARTMENT_ASSIGNMENTS_URL}/company/${company_id}/department/${department_id}`,
		});
	}

}
