export type DashboardTabId = "geral" | "projetos" | "pessoas" | "comercial";

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
}

export interface KpiCard {
  label: string;
  value: string;
  delta: string;
  deltaTone: "positive" | "negative" | "neutral";
  accentClassName: string;
  helper?: string;
}

export interface DeliveriesPoint {
  month: string;
  value: number;
}

export interface EngagementItem {
  area: string;
  score: number;
}

export interface ProposalFunnelStage {
  label: string;
  value: number;
  percentage: number;
}

export type ProjectStatus = "no-prazo" | "atencao" | "atrasado";

export interface ActiveProjectRow {
  project: string;
  manager: string;
  status: ProjectStatus;
  progress: number;
}
