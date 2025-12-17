export interface CaseStatsSummary {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  unassigned_cases: number;
  unread_cases: number;
}

export interface CaseStatsGroup {
  label: string;
  total: number;
}

export interface CaseStatsResponse {
  summary: CaseStatsSummary;
  by_channel: CaseStatsGroup[];
  by_agent: CaseStatsGroup[];
  by_funnel_stage: CaseStatsGroup[];
}