import type { PeriodSummary } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function SummaryStat({ value, label, valueClassName }: { value: string | number; label: string; valueClassName?: string }) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "truncate text-xl font-extrabold leading-none text-slate-950 @xs:text-2xl @sm:text-3xl",
          valueClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-tight text-slate-400 @sm:text-sm">{label}</p>
    </div>
  );
}

export function PeriodSummaryCard({ summary, className }: { summary: PeriodSummary; className?: string }) {
  return (
    <Card className={cn("@container flex h-full flex-col rounded-[24px] p-5 @sm:p-6 @lg:p-7", className)}>
      <h2 className="text-xl font-extrabold text-slate-950 @md:text-2xl">Resumo do periodo</h2>
      <p className="mt-1 truncate text-xs text-slate-500 @md:text-sm">{summary.periodLabel}</p>

      <div className="mt-5 grid flex-1 grid-cols-2 content-between gap-x-3 gap-y-5 @sm:mt-6 @sm:gap-x-6 @sm:gap-y-6">
        <SummaryStat value={summary.pipelineOpen} label="em pipeline ativo" />
        <SummaryStat value={summary.conversionRate} label="conversao" />
        <SummaryStat value={summary.clients} label="clientes" />
        {/* Currency never wraps, so it steps down with the card's own width instead
            of clipping — the sidebar shrinks this card without touching the viewport. */}
        <SummaryStat
          value={summary.revenueWon}
          label="ganho no periodo"
          valueClassName="text-base @xs:text-lg @sm:text-xl @lg:text-2xl"
        />
      </div>
    </Card>
  );
}
