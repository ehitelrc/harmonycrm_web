export interface RolePermissionView {
  role_id: number;        // ID del rol
  permission_id: number;  // ID del permiso
  code: string;           // Código único del permiso
  description?: string;   // Descripción (puede ser null)
  assigned: boolean;      // true si el rol tiene el permiso, false si no
}