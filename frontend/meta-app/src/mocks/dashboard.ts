import type {
  ActiveProjectRow,
  DashboardTab,
  DeliveriesPoint,
  EngagementItem,
  KpiCard,
  ProposalFunnelStage,
} from "@/types/dashboard";

export const dashboardTabs: DashboardTab[] = [
  { id: "geral", label: "Geral" },
  { id: "projetos", label: "Projetos" },
  { id: "pessoas", label: "Pessoas" },
  { id: "comercial", label: "Comercial" },
];

export const kpiCards: KpiCard[] = [
  {
    label: "HEADCOUNTS",
    value: "142",
    delta: "+8 vs mês anterior",
    deltaTone: "positive",
    accentClassName: "bg-navy-900",
  },
  {
    label: "PROJETOS ATIVOS",
    value: "24",
    delta: "+12% vs mês anterior",
    deltaTone: "positive",
    accentClassName: "bg-sky-400",
  },
  {
    label: "TAXA DE ENTREGA",
    value: "96%",
    delta: "+3pp vs mês anterior",
    deltaTone: "positive",
    accentClassName: "bg-emerald-500",
  },
  {
    label: "NPS INTERNO",
    value: "78",
    delta: "+5 vs mês anterior",
    deltaTone: "positive",
    accentClassName: "bg-amber-400",
  },
];

export const deliveriesByMonth: DeliveriesPoint[] = [
  { month: "Jul", value: 8 },
  { month: "Ago", value: 12 },
  { month: "Set", value: 15 },
  { month: "Out", value: 11 },
  { month: "Nov", value: 18 },
  { month: "Dez", value: 21 },
  { month: "Jan", value: 25 },
  { month: "Fev", value: 20 },
  { month: "Mar", value: 24 },
  { month: "Abr", value: 26 },
  { month: "Mai", value: 28 },
  { month: "Jun", value: 33 },
];

export const engagementByArea: EngagementItem[] = [
  { area: "GN", score: 88 },
  { area: "OP", score: 76 },
  { area: "TD", score: 92 },
  { area: "CE", score: 71 },
  { area: "DM", score: 84 },
];

export const proposalFunnel: ProposalFunnelStage[] = [
  { label: "Leads", value: 248, percentage: 100 },
  { label: "Qualificados", value: 132, percentage: 53 },
  { label: "Proposta", value: 72, percentage: 29 },
  { label: "Fechados", value: 28, percentage: 11 },
];

export const activeProjectRows: ActiveProjectRow[] = [
  { project: "Sicredi · Operações", manager: "Carla D.", status: "no-prazo", progress: 78 },
  { project: "Vivo · Atendimento", manager: "João M.", status: "no-prazo", progress: 64 },
  { project: "Itaú · Eficiência", manager: "Pedro H.", status: "atencao", progress: 42 },
  { project: "Magalu · Logística", manager: "Felipe T.", status: "atrasado", progress: 28 },
];
