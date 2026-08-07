"use client";

import { useState } from "react";
import { Circle } from "lucide-react";
import { useApi, useApiVarios } from "@/lib/use-api";
import { CommercialFunnelCard } from "@/components/commercial/CommercialFunnelCard";
import { OutcomeStatsCard } from "@/components/commercial/OutcomeStatsCard";
import { OriginBarList } from "@/components/commercial/OriginBarList";
import { LossReasonsCard } from "@/components/commercial/LossReasonsCard";
import { PeriodSummaryCard } from "@/components/commercial/PeriodSummaryCard";
import { OpportunitiesTable } from "@/components/commercial/OpportunitiesTable";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import { brl } from "@/lib/format";
import {
  corDoMotivo,
  rotuloStatus,
  type LossReason,
  type Opportunity,
  type OutcomeStat,
  type PeriodSummary,
  type ResumoComercialApi,
  type TabelaOportunidadesApi,
} from "@/types/commercial";

const PAGE_SIZE = 50;

function dataBR(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function CommercialContent() {
  const [pagina, setPagina] = useState(1);

  const resumoState = useApiVarios<[ResumoComercialApi]>(["/comercial/resumo"]);
  const tabelaState = useApi<TabelaOportunidadesApi>(
    `/comercial/tabela-oportunidades?page=${pagina}&page_size=${PAGE_SIZE}`,
  );

  if (resumoState.erro) {
    return <ErroCard erro={resumoState.erro} titulo="Não foi possível carregar o comercial" />;
  }

  if (resumoState.carregando || !resumoState.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const [resumo] = resumoState.data;

  const desfechos: OutcomeStat[] = [
    {
      value: String(resumo.desfechos.ganhos),
      label: "Ganhos",
      valueClassName: "text-emerald-600",
      helper: brl(resumo.desfechos.valor_ganho),
    },
    {
      value: String(resumo.desfechos.perdidos),
      label: "Perdidos",
      valueClassName: "text-red-500",
    },
    {
      value: String(resumo.desfechos.postergados),
      label: "Postergados",
      valueClassName: "text-amber-500",
    },
  ];

  const motivos: LossReason[] = resumo.motivos_perda.map((m, i) => ({
    label: m.label,
    value: m.value,
    colorClassName: corDoMotivo(i),
  }));

  const periodo: PeriodSummary = {
    // O filtro de período ainda não existe; o rótulo diz o que os números são
    // de fato, em vez de anunciar um recorte que não está sendo aplicado.
    periodLabel: "Todo o histórico",
    pipelineOpen: resumo.resumo.pipeline_aberto,
    conversionRate: `${resumo.resumo.taxa_conversao_pct}%`,
    clients: resumo.resumo.clientes,
    revenueWon: brl(resumo.resumo.valor_ganho),
  };

  const oportunidades: Opportunity[] =
    tabelaState.data?.items.map((op) => ({
      id: `#${op.id}`,
      createdAt: dataBR(op.criado_em),
      contact: op.contato,
      status: rotuloStatus(op.status),
      origin: op.origem,
      coordination: op.coordenacao,
    })) ?? [];

  return (
    <>
      <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2.5 text-xs @3xl:text-[13px] @5xl:mb-6 @5xl:gap-3 @5xl:text-sm">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 @5xl:px-3.5">
          <Circle className="h-2 w-2 shrink-0 fill-blue-600 text-blue-600" />
          <span className="min-w-0 break-words">Lendo: {periodo.periodLabel}</span>
        </span>
      </div>

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] @3xl:gap-5 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] @6xl:mb-6 @6xl:gap-6">
        <div className="min-w-0">
          <CommercialFunnelCard
            stages={resumo.funil}
            openCount={periodo.pipelineOpen}
            conversionRate={periodo.conversionRate}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4 @3xl:gap-5 @6xl:gap-6">
          <OutcomeStatsCard stats={desfechos} />
          <OriginBarList origins={resumo.origens} className="flex-1" />
        </div>
      </div>

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] @3xl:gap-5 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] @6xl:mb-6 @6xl:gap-6">
        <div className="min-w-0">
          <LossReasonsCard reasons={motivos} />
        </div>
        <div className="min-w-0">
          <PeriodSummaryCard summary={periodo} className="h-full" />
        </div>
      </div>

      {tabelaState.erro ? (
        <ErroCard erro={tabelaState.erro} titulo="Não foi possível carregar as oportunidades" />
      ) : (
        <OpportunitiesTable
          opportunities={oportunidades}
          carregando={tabelaState.carregando}
          pagination={{
            from: tabelaState.data?.page_from ?? 0,
            to: tabelaState.data?.page_to ?? 0,
            total: tabelaState.data?.total ?? 0,
            totalPages: tabelaState.data?.total_pages ?? 1,
            currentPage: pagina,
          }}
          onPageChange={setPagina}
        />
      )}
    </>
  );
}
