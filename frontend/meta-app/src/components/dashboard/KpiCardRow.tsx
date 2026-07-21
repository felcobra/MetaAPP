import type { KpiCard } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const deltaToneClasses = {
  positive: "text-emerald-600",
  negative: "text-red-500",
  neutral: "text-slate-500",
};

export function KpiCardRow({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <span className={cn("mb-3 block h-1 w-16 rounded-full", card.accentClassName)} />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {card.label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", deltaToneClasses[card.deltaTone])}>
            ↗ {card.delta}
          </p>
        </Card>
      ))}
    </div>
  );
}
