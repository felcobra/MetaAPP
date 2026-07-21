import type { LossReason } from "@/types/commercial";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { LossReasonsDonut } from "./LossReasonsDonut";

export function LossReasonsCard({ reasons }: { reasons: LossReason[] }) {
  const total = reasons.reduce((sum, reason) => sum + reason.value, 0);
  const midPoint = Math.ceil(reasons.length / 2);
  const columns = [reasons.slice(0, midPoint), reasons.slice(midPoint)];

  return (
    <Card>
      <CardEyebrow>MOTIVOS DE PERDA</CardEyebrow>
      <p className="mt-1 text-sm text-slate-500">
        Por que oportunidades não avançam (no período) · {total.toLocaleString("pt-BR")} perdas
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <LossReasonsDonut reasons={reasons} />

        <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="space-y-2">
              {column.map((reason) => (
                <li key={reason.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${reason.colorClassName}`} />
                  <span className="min-w-0 flex-1 truncate text-slate-600">{reason.label}</span>
                  <span className="shrink-0 font-semibold text-slate-800">{reason.value}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </Card>
  );
}
