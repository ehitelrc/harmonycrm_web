export interface DashboardStats {
  company_id: number;
  company_name: string;
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  closed_today: number;
  opened_today: number;
  cancelled_cases: number;
  unassigned_agents: number;
  unassigned_clients: number;
  avg_close_hours: number;
  cases_by_channel: CaseChannelStat[];
  cases_by_agent: CaseAgentStat[];
  oldest_open_cases: OldestOpenCase[];
  department_id?: number | null;
}

export interface CaseChannelStat {
  channel_id?: number | null;
  channel_name?: string | null;
  open_cases: number | null;
  closed_cases: number | null;
}

export interface CaseAgentStat {
  agent_id?: number | null;
  agent_name?: string | null;
  open_cases: number | null;
  closed_cases: number | null;
  avg_close_hours?: number | null;
}

export interface OldestOpenCase {
  case_id: number;
  client_name?: string | null;
  created_at?: string | null;
}