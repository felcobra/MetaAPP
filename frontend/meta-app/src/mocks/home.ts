import { Briefcase, FileText, Users, Wallet, Building, FolderKanban } from "lucide-react";
import type {
  Birthday,
  ConnectedSystemStep,
  ProjectsOverview,
  Recognition,
  RevenueProgress,
  SalesFunnelStage,
} from "@/types/home";

export const connectedSystemSteps: ConnectedSystemStep[] = [
  {
    icon: Users,
    value: "75",
    label: "Pessoas",
    helper: "5 células - 5 coord.",
    href: "/orgchart",
    iconClassName: "bg-gradient-to-br from-sky-400 to-blue-600",
  },
  {
    icon: FileText,
    value: "27",
    label: "Serviços",
    helper: "Carta Técnica",
    href: "/portfolio",
    iconClassName: "bg-gradient-to-br from-rose-300 to-rose-500",
  },
  {
    icon: FolderKanban,
    value: "22",
    label: "Projetos",
    helper: "Portfólio",
    href: "/external-projects",
    iconClassName: "bg-gradient-to-br from-amber-300 to-amber-500",
  },
  {
    icon: Building,
    value: "18",
    label: "Clientes",
    helper: "17 oport. abertas",
    href: "/commercial",
    iconClassName: "bg-gradient-to-br from-cyan-300 to-cyan-500",
  },
  {
    icon: Briefcase,
    value: "20",
    label: "Contratos",
    helper: "R$ 114.375",
    href: "/commercial",
    iconClassName: "bg-gradient-to-br from-violet-300 to-violet-500",
  },
  {
    icon: Wallet,
    value: "R$ 2.215",
    label: "Financeiro",
    helper: "Resultados no período",
    href: "/dashboards",
    iconClassName: "bg-gradient-to-br from-emerald-300 to-emerald-500",
  },
];

export const revenueProgress: RevenueProgress = {
  percentage: 80,
  currentLabel: "FATURAMENTO ATUAL",
  currentValue: "R$ 111.745",
  targetLabel: "Meta para subir no palco",
  targetValue: "R$ 140.000",
  negotiationLabel: "PROJETOS EM NEGOCIAÇÃO",
  negotiationValue: "R$ 145.000+",
  gapLabel: "GAP PARA A META",
  gapValue: "R$ 28.255",
};

export const salesFunnel: SalesFunnelStage[] = [
  { label: "Leads", value: 248, percentage: 100 },
  { label: "Qualificados", value: 132, percentage: 53 },
  { label: "Proposta", value: 72, percentage: 29 },
  { label: "Fechados", value: 28, percentage: 11 },
];

export const projectsOverview: ProjectsOverview = {
  active: 24,
  activeDelta: "+3 este mês",
  completed: 182,
  completedOnTimeLabel: "96% no prazo",
  teamCapacityLabel: "Capacidade do time",
  teamCapacityPercentage: 68,
};

export const birthdays: Birthday[] = [
  { initials: "MC", name: "Marina Costa", department: "Consultoria" },
  { initials: "RL", name: "Rafael Lima", department: "TI" },
  { initials: "HS", name: "Helena Souza", department: "Financeiro" },
];

export const recognitions: Recognition[] = [
  { initials: "PH", name: "Pedro Henrique", achievement: "Entrega excepcional no projeto Vivo" },
  { initials: "CD", name: "Carla Drummond", achievement: "NPS 92 no projeto Sicredi" },
  { initials: "TP", name: "Time PAPE", achievement: "Implementação 360 em 4 semanas" },
];
