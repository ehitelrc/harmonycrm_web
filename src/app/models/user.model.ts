export interface User {
	id: number;
	email: string;
	full_name: string;
	profile_image_url?: string | null;
	role: string;
	is_active: boolean;
	auth_provider: string;
	created_at: string;
	updated_at: string;
	password_hash?: string;
	is_super_user?: boolean;
}


export interface UserRequest {
  id?: string;
  email: string;
  full_name: string;
  profile_image_url?: string | null;
  is_active: boolean;
  password_hash?: string;   // opcional, solo para crear/editar
}