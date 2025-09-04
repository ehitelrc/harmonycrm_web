export interface Department {
  id: number;
  company_id: number;
  name: string;
  description?: string | null;
  // No exponemos created_at ni updated_at en las pantallas
}

export type Departments = Department[];