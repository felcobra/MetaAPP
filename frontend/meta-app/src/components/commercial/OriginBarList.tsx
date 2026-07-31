import type { OriginItem } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function OriginBarList({ origins, className }: { origins: OriginItem[]; className?: string }) {
  const max = Math.max(...origins.map((origin) => origin.value));

  return (
    <Card className={cn("@container flex h-full flex-col rounded-[24px] p-5 @sm:p-6 @lg:p-7", className)}>
      <h2 className="text-xl font-extrabold text-slate-950 @md:text-2xl">Origem das oportunidades</h2>
      <p className="mt-1.5 break-words text-xs text-slate-500 @md:mt-2 @md:text-sm">De onde vem as demandas (no periodo)</p>

      {/* A coluna do rotulo cede espaco antes da barra: com o menu aberto a barra
          continua legivel em vez de virar um risco de poucos pixels. */}
      <ul className="mt-5 flex flex-1 flex-col justify-center gap-3 @md:mt-8 @md:gap-4">
        {origins.map((origin) => (
          <li key={origin.label} className="grid min-w-0 grid-cols-[minmax(0,7rem)_minmax(0,1fr)_2.25rem] items-center gap-2.5 @sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_2.75rem] @sm:gap-3 @lg:grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)_3.5rem] @lg:gap-4">
            <span className="min-w-0 truncate text-xs font-medium text-slate-700 @md:text-sm">{origin.label}</span>
            <div className="h-3 min-w-0 overflow-hidden rounded-full bg-slate-100 @md:h-4">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(origin.value / max) * 100}%` }} />
            </div>
            <span className="min-w-0 truncate text-right text-xs font-extrabold text-slate-950 @md:text-sm">{origin.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
