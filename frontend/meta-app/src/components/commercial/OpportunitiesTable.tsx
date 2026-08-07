"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Target, Users } from "lucide-react";
import type { Opportunity, OpportunityStatus } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

const statusTone: Record<OpportunityStatus, "info" | "danger" | "success" | "neutral" | "warning"> = {
  Ativo: "info",
  Desistido: "danger",
  Recusado: "neutral",
  Ganho: "success",
  Postergado: "warning",
};

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  pagination: { from: number; to: number; total: number; totalPages: number; currentPage: number };
  onPageChange: (page: number) => void;
  carregando?: boolean;
}

export function OpportunitiesTable({
  opportunities,
  pagination,
  onPageChange,
  carregando,
}: OpportunitiesTableProps) {
  const [view, setView] = useState("oportunidades");
  const page = pagination.currentPage;

  // A pagina atual sempre aparece na régua, junto das duas vizinhas de cada
  // lado. Antes eram os numeros 1..5 fixos, entao a partir da pagina 6 nenhum
  // botao correspondia a pagina em que se estava.
  const inicio = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, pagination.totalPages) },
    (_, i) => inicio + i,
  ).filter((n) => n <= pagination.totalPages);

  return (
    <section className="@container min-w-0">
      <div className="mb-4 flex min-w-0 flex-col justify-between gap-3 @lg:flex-row @lg:items-center @lg:gap-4">
        <Tabs
          options={[
            { id: "oportunidades", label: "Oportunidades", icon: <Target className="h-4 w-4" /> },
            { id: "clientes", label: "Clientes", icon: <Users className="h-4 w-4" /> },
          ]}
          value={view}
          onChange={setView}
          className="w-fit"
        />
        <button type="button" className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-500 shadow-sm hover:bg-slate-50 @lg:w-44 @3xl:h-11 @3xl:w-52 @3xl:px-4">
          Todas as fases
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <Card padding="none" className="min-w-0 overflow-hidden rounded-[22px]">
        {view === "oportunidades" ? (
          <div className="overflow-x-auto">
            {/* min-w apertado + celulas compactas ate @4xl: com o menu aberto a
                tabela cabe inteira, sem rolagem horizontal, em vez de manter as
                celulas largas e empurrar colunas para fora. */}
            <table className="w-full min-w-[720px] border-collapse text-[13px] @4xl:min-w-[980px] @4xl:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-sm font-extrabold text-slate-950 @4xl:text-base">
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">ID</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Criado em</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Card / Contato</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Status</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Origem</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Coord.</th>
                  <th className="px-3 py-4 @2xl:px-4 @4xl:px-5 @4xl:py-6">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-extrabold text-slate-700 @2xl:px-4 @4xl:px-5">{opportunity.id}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-bold text-slate-500 @2xl:px-4 @4xl:px-5">{opportunity.createdAt}</td>
                    <td className="max-w-40 px-3 py-2.5 font-extrabold text-slate-700 @2xl:px-4 @4xl:max-w-72 @4xl:px-5"><span className="block truncate">{opportunity.contact}</span></td>
                    <td className="px-3 py-2.5 @2xl:px-4 @4xl:px-5"><Badge tone={statusTone[opportunity.status]} className="normal-case tracking-normal">{opportunity.status}</Badge></td>
                    <td className="px-3 py-2.5 font-bold text-slate-500 @2xl:px-4 @4xl:px-5">{opportunity.origin}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-700 @2xl:px-4 @4xl:px-5">{opportunity.coordination}</td>
                    <td className="max-w-40 truncate px-3 py-2.5 text-slate-500 @2xl:px-4 @4xl:max-w-none @4xl:px-5">{opportunity.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-sm text-slate-400">Selecione a aba Oportunidades para ver o pipeline detalhado por card.</p>
        )}

        <div className="flex min-w-0 flex-col items-start justify-between gap-3 p-4 text-[13px] font-bold text-slate-500 @2xl:flex-row @2xl:items-center @4xl:p-5 @4xl:text-base">
          <span className="min-w-0 break-words">
            {carregando
              ? "Carregando..."
              : `Exibindo ${pagination.from} a ${pagination.to} de ${pagination.total}.`}
          </span>
          <div className="flex shrink-0 items-center gap-3 @4xl:gap-4">
            <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} className="text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled={page === 1} aria-label="Pagina anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((number) => (
              <button key={number} type="button" onClick={() => onPageChange(number)} className={page === number ? "text-slate-950" : "text-slate-500 hover:text-slate-900"}>{number}</button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < pagination.totalPages ? (
              <span className="text-slate-400">...</span>
            ) : null}
            <button type="button" onClick={() => onPageChange(pagination.totalPages)} className={page === pagination.totalPages ? "text-slate-950" : "text-slate-500 hover:text-slate-900"}>{pagination.totalPages}</button>
            <button type="button" onClick={() => onPageChange(Math.min(pagination.totalPages, page + 1))} className="text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled={page === pagination.totalPages} aria-label="Proxima pagina">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
