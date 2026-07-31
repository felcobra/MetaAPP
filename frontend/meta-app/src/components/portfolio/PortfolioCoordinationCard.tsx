import type { PortfolioCoordination } from "@/types/portfolio";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function PortfolioCoordinationCard({ coordination }: { coordination: PortfolioCoordination }) {
  return (
    <Card className={cn("min-w-0", coordination.accentClassName)}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-base font-bold text-slate-900">
          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", coordination.dotClassName)} />
          <span className="truncate">{coordination.name}</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-400">
          {coordination.code} a {coordination.opportunities} oport.
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {coordination.services.map((service) => (
          <li key={service.name} className="flex min-w-0 items-center gap-3">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", service.iconClassName)}>
              <service.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 break-words text-sm font-medium text-slate-700">{service.name}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
