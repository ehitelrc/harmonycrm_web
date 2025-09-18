export interface CompanyUserView {
  company_id: number;
  company_name: string;
  user_id: number;
  full_name: string;
  email: string;
}

export interface UserRoleCompanyManage {
  user_id: number;
  company_id: number;
  role_id: number;
  user_role_company: string;
  has_role: boolean;
}

export interface CompanyUser {
    company_id: number;
    company_name: string;
}
