"use client";

import { useApiVarios } from "@/lib/use-api";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import {
  rotuloMes,
  type ActiveProjectRow,
  type DeliveriesPoint,
  type DeliveryApi,
  type EngagementItem,
  type KpiCard,
  type KpisApi,
  type ProposalFunnelStage,
} from "@/types/dashboard";
import type { HomeData } from "@/types/home";

/** "—" quando o indicador não tem base de cálculo (nenhum PAPE respondido). */
function ou(valor: number | null, sufixo = ""): string {
  return valor === null ? "—" : `${valor}${sufixo}`;
}

function montarKpis(k: KpisApi): KpiCard[] {
  return [
    { label: "HEADCOUNT", value: String(k.headcount), accentClassName: "bg-navy-900" },
    {
      label: "PROJETOS ATIVOS",
      value: String(k.projetos_ativos),
      accentClassName: "bg-sky-400",
    },
    {
      label: "TAXA DE ENTREGA",
      value: ou(k.taxa_entrega_pct, "%"),
      helper: "Média de eficácia da metodologia nos PAPEs",
      accentClassName: "bg-emerald-500",
    },
    {
      label: "NPS INTERNO",
      value: ou(k.nps_interno),
      helper: "Satisfação do cliente nos PAPEs, convertida para escala NPS",
      accentClassName: "bg-amber-400",
    },
  ];
}

export function DashboardsContent() {
  const { data, erro, carregando } = useApiVarios<
    [KpisApi, DeliveryApi[], EngagementItem[], ActiveProjectRow[], HomeData]
  >([
    "/dashboard/kpis",
    "/dashboard/deliveries-by-month",
    "/dashboard/engagement-by-area",
    "/dashboard/active-projects",
    "/dashboard/home",
  ]);

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar os dashboards" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const [kpis, entregas, engajamento, projetos, home] = data;

  const deliveries: DeliveriesPoint[] = entregas.map((d) => ({
    month: rotuloMes(d.month),
    value: d.value,
  }));

  // O funil de propostas do dashboard e o da Home saem do mesmo cálculo;
  // reaproveitar /dashboard/home evita duplicar essa consulta no backend.
  const funil: ProposalFunnelStage[] = home.sales_funnel;

  return (
    <DashboardTabs
      kpiCards={montarKpis(kpis)}
      deliveries={deliveries}
      engagement={engajamento}
      proposalFunnel={funil}
      activeProjects={projetos}
    />
  );
}
