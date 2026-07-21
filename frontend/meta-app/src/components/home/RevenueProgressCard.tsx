import { revenueProgress } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function RevenueProgressCard() {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <div>
          <CardEyebrow>FATURAMENTO</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Progresso da meta</h3>
        </div>
        <span className="text-3xl font-bold text-blue-600">{revenueProgress.percentage}%</span>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {revenueProgress.currentLabel}
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{revenueProgress.currentValue}</p>
      </div>

      <div className="mt-4">
        <ProgressBar value={revenueProgress.percentage} className="h-3" />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>R$ 0</span>
          <span>
            {revenueProgress.targetLabel}: {revenueProgress.targetValue}
          </span>
        </div>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {revenueProgress.negotiationLabel}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {revenueProgress.negotiationValue}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {revenueProgress.gapLabel}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{revenueProgress.gapValue}</p>
        </div>
      </div>
    </Card>
  );
}
