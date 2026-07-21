import type { OutcomeStat } from "@/types/commercial";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function OutcomeStatsCard({ stats }: { stats: OutcomeStat[] }) {
  return (
    <Card>
      <CardEyebrow>DESFECHO NO PERÍODO</CardEyebrow>
      <p className="mt-1 text-sm text-slate-500">Estados terminais — fora do pipeline ativo</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-slate-50 p-4 text-center">
            <p className={cn("text-2xl font-bold", stat.valueClassName ?? "text-slate-900")}>
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            {stat.helper ? <p className="mt-1 text-xs text-slate-500">{stat.helper}</p> : null}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Ganhos/Perdidos/Postergados não inflam o funil ativo - leitura atual protegida.
      </p>
    </Card>
  );
}
