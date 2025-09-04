export interface Client {
  id: number;
  external_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;   // no lo mostramos en UI
  updated_at?: string;   // no lo mostramos en UI
}