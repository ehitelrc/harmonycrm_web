export interface MoveCaseStagePayload {
  case_id: number;
  funnel_id: number;
  from_stage_id: number | null;
  to_stage_id: number;
  note?: string | null;
  changed_by?: number; // si lo ocupas
}