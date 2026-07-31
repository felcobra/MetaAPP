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
      {/* @container: a barra lateral muda a largura DESTE bloco, nao a da janela.
          Todo o escalonamento da pagina responde a esta largura, de modo que a
          distribuicao em duas colunas se mantem com o menu aberto. */}
      <div className="@container mx-auto min-w-0 max-w-[1500px]">
        <PageHeader
          eyebrow="COMERCIAL & FINANCEIRO"
          title="Comercial, Oportunidades & Clientes"
          description="O fluxo comercial da Meta de ponta a ponta. Use o filtro de periodo no topo para recortar a leitura."
        />

        <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2.5 text-xs @3xl:text-[13px] @5xl:mb-6 @5xl:gap-3 @5xl:text-sm">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 @5xl:px-3.5">
            <Circle className="h-2 w-2 shrink-0 fill-blue-600 text-blue-600" />
            <span className="min-w-0 break-words">Lendo: {periodSummary.periodLabel}</span>
          </span>
          <span className="min-w-0 break-words text-slate-500">Ajuste o periodo no filtro do topo.</span>
        </div>

        {/* Duas colunas a partir de 48rem de conteudo (e nao de viewport): com o
            menu aberto a pagina continua com a mesma distribuicao, as colunas so
            ficam proporcionalmente menores. Sem minmax em px para que nenhuma
            faixa force overflow horizontal. */}
        <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] @3xl:gap-5 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] @6xl:mb-6 @6xl:gap-6">
          <div className="min-w-0">
            <CommercialFunnelCard
              stages={commercialFunnel}
              openCount={periodSummary.pipelineOpen}
              conversionRate={periodSummary.conversionRate}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 @3xl:gap-5 @6xl:gap-6">
            <OutcomeStatsCard stats={outcomeStats} />
            <OriginBarList origins={opportunityOrigins} className="flex-1" />
          </div>
        </div>

        <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] @3xl:gap-5 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] @6xl:mb-6 @6xl:gap-6">
          <div className="min-w-0">
            <LossReasonsCard reasons={lossReasons} />
          </div>
          <div className="min-w-0">
            <PeriodSummaryCard summary={periodSummary} className="h-full" />
          </div>
        </div>

        <OpportunitiesTable opportunities={opportunities} pagination={opportunitiesPagination} />
      </div>
    </AppShell>
  );
}
