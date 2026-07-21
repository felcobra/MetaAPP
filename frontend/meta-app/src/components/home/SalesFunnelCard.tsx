import { ArrowUpRight } from "lucide-react";
import { salesFunnel } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function SalesFunnelCard() {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <div>
          <CardEyebrow>MARKETING E VENDAS</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Funil de vendas</h3>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-center gap-3">
        {salesFunnel.map((stage) => (
          <div key={stage.label} className="w-full">
            <div
              className="flex h-11 items-center justify-between rounded-lg brand-gradient px-4 text-sm font-semibold text-white"
              style={{ width: `${30 + stage.percentage * 0.7}%` }}
            >
              <span className="truncate">{stage.label}</span>
              <span className="ml-3 flex shrink-0 items-center gap-2">
                {stage.value}
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {stage.percentage}%
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
