import type { LucideIcon } from "lucide-react";

/** Configuração visual de cada bloco da faixa "sistema conectado". Os números
 * vêm da API; ícone, cor e destino são decisão de interface. */
export interface ConnectedSystemStep {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
  href: string;
  iconClassName: string;
}

/** GET /dashboard/home */
export interface HomeData {
  revenue: {
    fat_atual: number;
    fat_total: number;
    em_negociacao_count: number;
    em_negociacao_valor: number;
  };
  sales_funnel: SalesFunnelStage[];
  projects_overview: { active: number; completed: number };
  birthdays: Birthday[];
  recognitions: Recognition[];
}

/** GET /dashboard/ */
export interface DashboardGeral {
  rh: { total_membros: number; total_celulas: number; total_coordenacoes: number };
  projetos: { total: number; ativos: number; total_acompanhamentos: number };
  servicos: { total: number };
  clientes: { total: number };
  financeiro: {
    pendente: number;
    pago: number;
    atrasado: number;
    cancelado: number;
    total_recebido: number;
    total_a_receber: number;
  };
  contratos: { total: number; valor_total: number };
  crm: {
    total_leads: number;
    oportunidades: Record<string, number>;
    oportunidades_ativas: number;
  };
}

export interface SalesFunnelStage {
  label: string;
  value: number;
  percentage: number;
}

export interface Birthday {
  initials: string;
  name: string;
  department: string;
}

export interface Recognition {
  initials: string;
  name: string;
  achievement: string;
}
