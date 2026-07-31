import { Info } from "lucide-react";
import type { OutcomeStat } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function OutcomeStatsCard({ stats }: { stats: OutcomeStat[] }) {
  return (
    // As tres colunas nunca viram uma so: com o menu aberto elas apenas encolhem.
    // `truncate` e so uma rede de seguranca — nos tamanhos abaixo os rotulos cabem.
    <Card className="@container rounded-[24px] p-5 @sm:p-6 @lg:p-7">
      <h2 className="text-xl font-extrabold text-slate-950 @md:text-2xl">Desfecho no periodo</h2>
      <p className="mt-1.5 break-words text-xs text-slate-500 @md:mt-2 @md:text-sm">Estados terminais - fora do pipeline ativo</p>

      <div className="mt-5 grid grid-cols-3 gap-2 @sm:gap-2.5 @md:mt-7 @md:gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white px-1.5 py-4 text-center @sm:px-2 @md:py-6">
            <p className={cn("truncate text-xl font-extrabold leading-none @xs:text-2xl", stat.valueClassName ?? "text-slate-900")}>{stat.value}</p>
            <p className="mt-1.5 truncate text-[11px] text-slate-400 @xs:text-xs @md:mt-2 @md:text-sm">{stat.label}</p>
            {stat.helper ? <p className="mt-2 truncate text-[10px] font-bold text-slate-950 @xs:text-xs @md:mt-3">{stat.helper}</p> : null}
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2.5 text-[11px] text-slate-500 @sm:px-4 @md:mt-5 @md:py-3 @md:text-xs">
        <Info className="h-4 w-4 shrink-0 text-blue-600" />
        Ganhos/Perdidos/Postergados nao inflam o funil ativo - leitura atual protegida.
      </p>
    </Card>
  );
}
