import type { PeriodSummary } from "@/types/commercial";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function PeriodSummaryCard({ summary }: { summary: PeriodSummary }) {
  return (
    <Card>
      <CardEyebrow>RESUMO DO PERÍODO</CardEyebrow>
      <p className="mt-1 text-sm text-slate-500">{summary.periodLabel}</p>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <div>
          <p className="text-2xl font-bold text-slate-900">{summary.pipelineOpen}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            em pipeline ativo
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{summary.conversionRate}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">conversão</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{summary.clients}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">clientes</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{summary.revenueWon}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ganho no período
          </p>
        </div>
      </div>
    </Card>
  );
}
