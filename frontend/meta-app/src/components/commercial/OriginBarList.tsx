import type { OriginItem } from "@/types/commercial";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function OriginBarList({ origins }: { origins: OriginItem[] }) {
  const max = Math.max(...origins.map((origin) => origin.value));

  return (
    <Card>
      <CardEyebrow>ORIGEM DAS OPORTUNIDADES</CardEyebrow>
      <p className="mt-1 text-sm text-slate-500">De onde vêm as demandas (no período)</p>

      <ul className="mt-5 space-y-4">
        {origins.map((origin) => (
          <li key={origin.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm text-slate-600">{origin.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${(origin.value / max) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-semibold text-slate-800">
              {origin.value.toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
