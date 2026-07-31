import type { LossReason } from "@/types/commercial";
import { Card } from "@/components/ui/Card";
import { LossReasonsDonut } from "./LossReasonsDonut";

export function LossReasonsCard({ reasons }: { reasons: LossReason[] }) {
  const total = reasons.reduce((sum, reason) => sum + reason.value, 0);
  const midPoint = Math.ceil(reasons.length / 2);
  const columns = [reasons.slice(0, midPoint), reasons.slice(midPoint)];

  return (
    // Rosca a esquerda + duas colunas de legenda: o arranjo se mantem com o menu
    // aberto (breakpoints do container, nao do viewport). O que muda sao o
    // diametro da rosca, o corpo da legenda e a goteira entre as colunas.
    <Card className="@container rounded-[24px] p-5 @sm:p-6 @2xl:p-8">
      <h2 className="text-xl font-extrabold text-slate-950 @md:text-2xl">Motivos de perda</h2>
      <p className="mt-1 break-words text-xs text-slate-500 @md:text-sm">Por que oportunidades nao avancam (no periodo) - {total.toLocaleString("pt-BR")} perdas</p>

      <div className="mt-5 flex min-w-0 flex-col gap-5 @lg:flex-row @lg:items-start @lg:gap-6 @2xl:mt-8 @3xl:gap-8">
        <LossReasonsDonut reasons={reasons} />

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 @2xl:gap-x-6 @4xl:gap-x-10">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="min-w-0 space-y-2 @2xl:space-y-3">
              {column.map((reason) => (
                <li key={reason.label} className="grid min-w-0 grid-cols-[10px_minmax(0,1fr)_2rem] items-center gap-1.5 text-[11px] @2xl:grid-cols-[14px_minmax(0,1fr)_3rem] @2xl:gap-2 @2xl:text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded @2xl:h-3 @2xl:w-3 ${reason.colorClassName}`} />
                  <span className="min-w-0 truncate font-medium text-slate-500">{reason.label}</span>
                  <span className="min-w-0 truncate text-right font-extrabold text-slate-950">{reason.value}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </Card>
  );
}
