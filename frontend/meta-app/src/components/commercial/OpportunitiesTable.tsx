"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Opportunity, OpportunityStatus } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

const statusTone: Record<OpportunityStatus, "info" | "danger" | "success" | "neutral"> = {
  Ativo: "info",
  Desistido: "danger",
  Recusado: "danger",
  Ganho: "success",
};

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  pagination: { from: number; to: number; total: number; totalPages: number; currentPage: number };
}

export function OpportunitiesTable({ opportunities, pagination }: OpportunitiesTableProps) {
  const [view, setView] = useState("oportunidades");
  const [page, setPage] = useState(pagination.currentPage);

  const pageNumbers = [1, 2, 3, 4, 5];

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
        <Tabs
          options={[
            { id: "oportunidades", label: "Oportunidades" },
            { id: "clientes", label: "Clientes" },
          ]}
          value={view}
          onChange={setView}
        />
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Todas as fases
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {view === "oportunidades" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Criado em</th>
                <th className="px-6 py-3">Card / Contato</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Origem</th>
                <th className="px-6 py-3">Coord.</th>
                <th className="px-6 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 font-semibold text-blue-600">{opportunity.id}</td>
                  <td className="px-6 py-3.5 text-slate-500">{opportunity.createdAt}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{opportunity.contact}</td>
                  <td className="px-6 py-3.5">
                    <Badge tone={statusTone[opportunity.status]}>{opportunity.status}</Badge>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{opportunity.origin}</td>
                  <td className="px-6 py-3.5 text-slate-500">{opportunity.coordination}</td>
                  <td className="px-6 py-3.5 text-slate-400">{opportunity.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-6 text-sm text-slate-400">
          Selecione a aba Oportunidades para ver o pipeline detalhado por card.
        </p>
      )}

      <div className="flex flex-col items-center justify-between gap-3 p-6 text-sm text-slate-500 sm:flex-row">
        <span>
          Exibindo {pagination.from} a {pagination.to} de {pagination.total} (total: {pagination.total} no
          período).
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            disabled={page === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => setPage(number)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                page === number ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {number}
            </button>
          ))}
          <span className="px-1 text-slate-400">…</span>
          <button
            type="button"
            onClick={() => setPage(pagination.totalPages)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
              page === pagination.totalPages ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {pagination.totalPages}
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            disabled={page === pagination.totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
