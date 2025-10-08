export interface CaseItem {
  id: number;
  case_id: number;
  item_id: number;
  price: number;
  quantity: number;
  notes?: string;
  acquired: boolean;
  created_by?: number;
  created_at: string; // ISO 8601 timestamp (por ejemplo: "2025-10-07T14:30:00Z")
}

export interface CaseItemRequest {
  id: number | null; // null para crear, número para actualizar
  case_id: number;
  item_id: number;
  price: number;
  quantity: number;
  notes?: string;
  acquired: boolean;
}