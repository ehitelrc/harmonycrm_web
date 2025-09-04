export interface Funnel {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
 
}

export interface FunnelStage {
  id?: number;
  funnel_id?: number;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;

}