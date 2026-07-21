import { Check, ChevronRight } from "lucide-react";
import type { FormHistoryItem } from "@/types/forms";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function FormHistoryList({ items }: { items: FormHistoryItem[] }) {
  return (
    <div className="mt-10">
      <CardEyebrow>CONCLUÍDOS</CardEyebrow>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">Histórico recente</h2>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            padding="sm"
            className="flex items-center justify-between gap-4 transition-colors hover:border-blue-200"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-400">
                  {item.client} · {item.date}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Concluído
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
