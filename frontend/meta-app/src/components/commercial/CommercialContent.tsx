"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { usePeriod } from "@/lib/period-context";
import { PeriodoLido } from "@/components/shared/PeriodoLido";
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
  const { periodo, descricao, ativo, comPeriodo } = usePeriod();

  // Trocar o período encolhe a tabela: quem estava na página 30 do histórico
  // inteiro pediria a página 30 de um recorte que tem 3, e a tabela voltaria
  // vazia. Reset durante o render, o mesmo padrão que `use-api.ts` usa.
  const [periodoAnterior, setPeriodoAnterior] = useState(periodo);
  if (periodo !== periodoAnterior) {
    setPeriodoAnterior(periodo);
    setPagina(1);
  }

  // `comPeriodo` entra na string da rota, e o `useApi` refaz a chamada quando
  // ela muda — trocar o chip no topo já rebusca os dados, sem efeito extra.
  const resumoState = useApi<ResumoComercialApi>(comPeriodo("/comercial/resumo"));
  const tabelaState = useApi<TabelaOportunidadesApi>(
    comPeriodo(`/comercial/tabela-oportunidades?page=${pagina}&page_size=${PAGE_SIZE}`),
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

  const resumo = resumoState.data;

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

  const resumoPeriodo: PeriodSummary = {
    periodLabel: descricao,
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
      reason: op.motivo !== "—" ? op.motivo : undefined,
    })) ?? [];

  return (
    <>
      {/* `cliente` não tem coluna de data, então o total de clientes é sempre
          da base inteira. Dizer isso é mais barato do que a pessoa descobrir
          sozinha que um número do card não obedeceu ao filtro. */}
      <PeriodoLido
        descricao={resumoPeriodo.periodLabel}
        ativo={ativo}
        aviso="Clientes seguem contando a base inteira — não há data de cadastro para recortar."
      />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] @3xl:gap-5 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] @6xl:mb-6 @6xl:gap-6">
        <div className="min-w-0">
          <CommercialFunnelCard
            stages={resumo.funil}
            openCount={resumoPeriodo.pipelineOpen}
            conversionRate={resumoPeriodo.conversionRate}
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
          <PeriodSummaryCard summary={resumoPeriodo} className="h-full" />
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
