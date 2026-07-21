import type { Metadata } from "next";
import { Circle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { CommercialFunnelCard } from "@/components/commercial/CommercialFunnelCard";
import { OutcomeStatsCard } from "@/components/commercial/OutcomeStatsCard";
import { OriginBarList } from "@/components/commercial/OriginBarList";
import { LossReasonsCard } from "@/components/commercial/LossReasonsCard";
import { PeriodSummaryCard } from "@/components/commercial/PeriodSummaryCard";
import { OpportunitiesTable } from "@/components/commercial/OpportunitiesTable";
import {
  commercialFunnel,
  lossReasons,
  opportunities,
  opportunitiesPagination,
  opportunityOrigins,
  outcomeStats,
  periodSummary,
} from "@/mocks/commercial";

export const metadata: Metadata = {
  title: "Comercial | Meta App",
};

export default function CommercialPage() {
  return (
    <AppShell pageTitle="Comercial">
      <PageHeader
        eyebrow="COMERCIAL & FINANCEIRO"
        title="Comercial, Oportunidades & Clientes"
        description="O fluxo comercial da Meta de ponta a ponta. Use o filtro de período no topo para recortar a leitura."
      />

      <p className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
        <span className="font-semibold text-slate-700">
          Lendo: {periodSummary.periodLabel}
        </span>
        Ajuste o período no filtro do topo.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommercialFunnelCard
            stages={commercialFunnel}
            openCount={periodSummary.pipelineOpen}
            conversionRate={periodSummary.conversionRate}
          />
        </div>
        <div className="flex flex-col gap-6">
          <OutcomeStatsCard stats={outcomeStats} />
          <OriginBarList origins={opportunityOrigins} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LossReasonsCard reasons={lossReasons} />
        </div>
        <PeriodSummaryCard summary={periodSummary} />
      </div>

      <OpportunitiesTable opportunities={opportunities} pagination={opportunitiesPagination} />
    </AppShell>
  );
}
