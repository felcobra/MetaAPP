export type DashboardTabId = "geral" | "projetos" | "pessoas" | "comercial";

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
}

export interface KpiCard {
  label: string;
  value: string;
  /** Comparação com o período anterior. Opcional: nenhum endpoint calcula
   * variação mês a mês hoje, então os cards saem sem ela. */
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
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

/** Espelha o enum acompanhamento_projeto.status_cronograma do banco, mais
 * "sem-dados" para projeto sem nenhum acompanhamento respondido — comum em
 * projeto recém-criado, e diferente de estar atrasado. */
export type ProjectStatus =
  | "no-prazo"
  | "atencao"
  | "atrasado"
  | "concluido"
  | "sem-dados";

export interface ActiveProjectRow {
  project: string;
  manager: string;
  client: string;
  status: ProjectStatus;
  progress: number;
}

// ── Respostas cruas da API ───────────────────────────────────────────────────

/** GET /dashboard/kpis — campos null quando não há acompanhamento respondido. */
export interface KpisApi {
  headcount: number;
  projetos_ativos: number;
  taxa_entrega_pct: number | null;
  nps_interno: number | null;
}

/** GET /dashboard/deliveries-by-month — `month` vem como "2026-06". */
export interface DeliveryApi {
  month: string;
  value: number;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "2026-06" → "Jun". Formato cru só apareceria no eixo do gráfico. */
export function rotuloMes(iso: string): string {
  const mes = Number(iso.split("-")[1]);
  return MESES[mes - 1] ?? iso;
}
