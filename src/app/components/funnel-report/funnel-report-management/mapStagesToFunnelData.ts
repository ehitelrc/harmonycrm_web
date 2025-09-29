import { DashboardCampaignFunnelSummary } from "@app/models/campaign_funnel_summary_view";

 

export function mapStagesToFunnelData(stages: DashboardCampaignFunnelSummary[]) {
  return stages
    .sort((a, b) => a.position - b.position) // ordenar por posición del funnel
    .map(stage => ({
      name: stage.stage_name,
      value: stage.total_cases,
      extra: {
        color: stage.color_hex ?? '#4caf50' // usa el color del stage o verde por defecto
      }
    }));
}