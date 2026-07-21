export interface CommercialFunnelStage {
  label: string;
  value: number;
  deltaPercentage: number;
  deltaCount: number;
}

export interface OutcomeStat {
  value: string;
  label: string;
  valueClassName?: string;
  helper?: string;
}

export interface OriginItem {
  label: string;
  value: number;
}

export interface LossReason {
  label: string;
  value: number;
  colorClassName: string;
}

export interface PeriodSummary {
  periodLabel: string;
  pipelineOpen: number;
  conversionRate: string;
  clients: number;
  revenueWon: string;
}

export type OpportunityStatus = "Ativo" | "Desistido" | "Recusado" | "Ganho";

export interface Opportunity {
  id: string;
  createdAt: string;
  contact: string;
  status: OpportunityStatus;
  origin: string;
  coordination: string;
  reason?: string;
}
