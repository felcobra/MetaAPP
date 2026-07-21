import type { PortfolioCoordination } from "@/types/portfolio";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function DemandTable({ coordinations }: { coordinations: PortfolioCoordination[] }) {
  const totalOpportunities = coordinations.reduce((sum, item) => sum + item.opportunities, 0);
  const totalServices = coordinations.reduce((sum, item) => sum + item.services.length, 0);
  const maxOpportunities = Math.max(...coordinations.map((item) => item.opportunities));

  return (
    <Card>
      <CardEyebrow>DEMANDA POR COORDENAÇÃO</CardEyebrow>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">Demanda por coordenação</h3>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="py-3 pr-4">Coordenação</th>
              <th className="py-3 pr-4">Demanda</th>
              <th className="py-3 pr-4 text-right">Oportunidades</th>
              <th className="py-3 text-right">Serviços</th>
            </tr>
          </thead>
          <tbody>
            {coordinations.map((coordination) => (
              <tr key={coordination.code} className="border-b border-slate-100">
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className={cn("h-2 w-2 rounded-full", coordination.dotClassName)} />
                    {coordination.name}
                    <span className="text-xs font-medium text-slate-400">{coordination.code}</span>
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", coordination.dotClassName)}
                      style={{ width: `${(coordination.opportunities / maxOpportunities) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-semibold text-slate-800">
                  {coordination.opportunities}
                </td>
                <td className="py-3 text-right font-semibold text-slate-800">
                  {coordination.services.length}
                </td>
              </tr>
            ))}
            <tr className="font-bold text-slate-900">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4" />
              <td className="py-3 pr-4 text-right">{totalOpportunities}</td>
              <td className="py-3 text-right">{totalServices}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
