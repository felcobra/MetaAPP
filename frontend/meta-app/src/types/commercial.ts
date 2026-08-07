export interface CommercialFunnelStage {
  label: string;
  value: number;
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

/** Rótulos exibidos para oportunidade_status_terminal. */
export type OpportunityStatus =
  | "Ativo"
  | "Ganho"
  | "Desistido"
  | "Recusado"
  | "Postergado";

const STATUS_LABEL: Record<string, OpportunityStatus> = {
  ativo: "Ativo",
  fechado: "Ganho",
  desistido: "Desistido",
  recusado: "Recusado",
  postergado: "Postergado",
};

export function rotuloStatus(bruto: string): OpportunityStatus {
  return STATUS_LABEL[bruto] ?? "Ativo";
}

export interface Opportunity {
  id: string;
  createdAt: string;
  contact: string;
  status: OpportunityStatus;
  origin: string;
  coordination: string;
  reason?: string;
}

// ── Respostas cruas da API ───────────────────────────────────────────────────

/** GET /commercial/resumo */
export interface ResumoComercialApi {
  funil: { label: string; value: number }[];
  desfechos: {
    ganhos: number;
    perdidos: number;
    postergados: number;
    valor_ganho: number;
  };
  origens: { label: string; value: number }[];
  motivos_perda: { label: string; value: number }[];
  resumo: {
    pipeline_aberto: number;
    taxa_conversao_pct: number;
    clientes: number;
    valor_ganho: number;
  };
}

/** GET /commercial/tabela-oportunidades */
export interface TabelaOportunidadesApi {
  items: {
    id: number;
    criado_em: string | null;
    status: string;
    contato: string;
    origem: string;
    coordenacao: string;
  }[];
  total: number;
  total_pages: number;
  current_page: number;
  page_from: number;
  page_to: number;
}

/** As cores do donut são de interface; a API manda só rótulo e contagem.
 * As três primeiras fatias ganham cor própria e o resto vira cinza, que é
 * como o desenho original tratava a cauda longa de motivos. */
const CORES_MOTIVO = ["bg-red-400", "bg-amber-400", "bg-indigo-400", "bg-slate-400"];

export function corDoMotivo(indice: number): string {
  return CORES_MOTIVO[indice] ?? "bg-slate-300";
}
