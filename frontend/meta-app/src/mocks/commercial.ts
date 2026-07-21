import type {
  CommercialFunnelStage,
  LossReason,
  OpportunityStatus,
  Opportunity,
  OriginItem,
  OutcomeStat,
  PeriodSummary,
} from "@/types/commercial";

export const commercialFunnel: CommercialFunnelStage[] = [
  { label: "Caixa de Entrada", value: 8, deltaCount: 9, deltaPercentage: 22 },
  { label: "Ligação Diagnóstico", value: 2, deltaCount: 2, deltaPercentage: 0 },
  { label: "Reunião Diagnóstico", value: 0, deltaCount: 0, deltaPercentage: 400 },
  { label: "Proposta Comercial", value: 4, deltaCount: 4, deltaPercentage: 0 },
  { label: "Negociação", value: 0, deltaCount: 0, deltaPercentage: 0 },
  { label: "Pré-Assinatura de Contrato", value: 0, deltaCount: 0, deltaPercentage: 0 },
];

export const outcomeStats: OutcomeStat[] = [
  { value: "233", label: "Ganhos", valueClassName: "text-emerald-600", helper: "R$ 1.831.185" },
  { value: "2015", label: "Perdidos", valueClassName: "text-red-500" },
  { value: "41", label: "Postergados", valueClassName: "text-amber-500" },
];

export const opportunityOrigins: OriginItem[] = [
  { label: "Site", value: 1306 },
  { label: "Indicação", value: 258 },
  { label: "Prospecção Ativa", value: 115 },
  { label: "Fidelização", value: 110 },
  { label: "Site - Whatsapp", value: 83 },
];

export const lossReasons: LossReason[] = [
  { label: "O cliente sumiu", value: 160, colorClassName: "bg-red-400" },
  { label: "O cliente sumiu - Pré Diagnóstico", value: 155, colorClassName: "bg-amber-400" },
  { label: "O cliente não quer ouvir/agendar reunião", value: 118, colorClassName: "bg-indigo-400" },
  { label: "Optou pelo concorrente (sênior)", value: 100, colorClassName: "bg-slate-400" },
  { label: "O cliente não precisa mais do serviço", value: 60, colorClassName: "bg-slate-300" },
  { label: "Preço do projeto", value: 60, colorClassName: "bg-slate-300" },
  { label: "O cliente sumiu - Pós Diagnóstico", value: 57, colorClassName: "bg-slate-300" },
  { label: "O cliente sumiu - Caixa de Entrada", value: 52, colorClassName: "bg-slate-300" },
  { label: "Explicado nos comentários", value: 42, colorClassName: "bg-slate-300" },
  { label: "Explicado nos comentários (não se encaixa...)", value: 27, colorClassName: "bg-slate-300" },
  { label: "O lead sumiu/não quer prosseguir", value: 27, colorClassName: "bg-slate-300" },
  { label: "Não é prioridade", value: 24, colorClassName: "bg-slate-300" },
  { label: "Dados incorretos ou incompletos", value: 21, colorClassName: "bg-slate-300" },
  { label: "Optou pelo concorrente (júnior)", value: 19, colorClassName: "bg-slate-300" },
  { label: "O cliente sumiu - Retomar Contato", value: 19, colorClassName: "bg-slate-300" },
  { label: "O cliente não precisa do serviço", value: 11, colorClassName: "bg-slate-300" },
  { label: "O cliente só quer parceria", value: 10, colorClassName: "bg-slate-300" },
  { label: "O lead é desqualificado (necessidade)", value: 10, colorClassName: "bg-slate-300" },
  { label: "Prazo do projeto", value: 8, colorClassName: "bg-slate-300" },
  { label: "Lead não pode ouvir agora", value: 7, colorClassName: "bg-slate-300" },
  { label: "Optou pelo concorrente (prof. da área)", value: 7, colorClassName: "bg-slate-300" },
  { label: "Outros", value: 6, colorClassName: "bg-slate-300" },
  { label: "Tenho contato da empresa, sem contato do decisor", value: 4, colorClassName: "bg-slate-300" },
  { label: "O lead não priorizou o projeto", value: 4, colorClassName: "bg-slate-300" },
  { label: "Lead não tem orçamento", value: 5, colorClassName: "bg-slate-300" },
  { label: "Optou pelo concorrente (profissional)", value: 4, colorClassName: "bg-slate-300" },
  { label: "Lead não tem mais necessidade agora", value: 3, colorClassName: "bg-slate-300" },
  { label: "Optou pelo concorrente (sênior/prof.)", value: 2, colorClassName: "bg-slate-300" },
];

export const periodSummary: PeriodSummary = {
  periodLabel: "Todo o histórico",
  pipelineOpen: 15,
  conversionRate: "10%",
  clients: 18,
  revenueWon: "R$ 1.831.185",
};

const statusMap: Record<string, OpportunityStatus> = {
  Ativo: "Ativo",
  Desistido: "Desistido",
  Recusado: "Recusado",
};

export const opportunities: Opportunity[] = [
  { id: "#24034", createdAt: "05/07/2026", contact: "Enzo Ribeiro Mendez Pi", status: statusMap.Ativo, origin: "Site", coordination: "—" },
  { id: "#24003", createdAt: "02/07/2026", contact: "Francisco Casimiro", status: statusMap.Ativo, origin: "Site", coordination: "GN" },
  { id: "#24001", createdAt: "02/07/2026", contact: "Renan Silva Silv", status: statusMap.Desistido, origin: "Site", coordination: "DM" },
  { id: "#21578", createdAt: "29/06/2026", contact: "Rafaela", status: statusMap.Ativo, origin: "Site", coordination: "DM" },
  { id: "#21576", createdAt: "27/06/2026", contact: "Ariane", status: statusMap.Desistido, origin: "Site", coordination: "OP" },
  { id: "#21574", createdAt: "27/06/2026", contact: "Alecsandro", status: statusMap.Desistido, origin: "Site", coordination: "DM" },
  { id: "#21568", createdAt: "26/06/2026", contact: "Leonardo Parreira", status: statusMap.Desistido, origin: "Site", coordination: "TD" },
  { id: "#21565", createdAt: "24/06/2026", contact: "Otavio Monteiro", status: statusMap.Ativo, origin: "Site", coordination: "DM" },
  { id: "#11982", createdAt: "23/06/2026", contact: "Fernando Pereira de Sá", status: "Recusado", origin: "Site", coordination: "DM" },
];

export const opportunitiesPagination = {
  from: 1,
  to: 200,
  total: 2402,
  totalPages: 13,
  currentPage: 1,
};
