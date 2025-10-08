export type ItemType = 'product' | 'service';

export interface Item {
  id: number;
  company_id: number;
  name: string;
  description?: string | null;
  type: ItemType;     // 'product' | 'service'
  item_price: number; // precio por defecto
  created_at?: string;
  updated_at?: string;
}