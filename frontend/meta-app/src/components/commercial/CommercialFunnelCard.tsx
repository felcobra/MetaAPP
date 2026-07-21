import type { CommercialFunnelStage } from "@/types/commercial";

function TrapezoidStage({
  stage,
  widthPercent,
}: {
  stage: CommercialFunnelStage;
  widthPercent: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div
        className="relative flex h-16 items-center justify-center bg-gradient-to-b from-sky-300 to-blue-700 text-lg font-bold text-white"
        style={{
          width: `${widthPercent}%`,
          minWidth: "3.5rem",
          clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
        }}
      >
        {stage.value}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-white">{stage.label}</p>
        <p className="text-sm text-slate-400">
          {stage.value} oportunidades
          {stage.deltaPercentage !== 0 ? (
            <span className="ml-2 text-amber-400">↓ {stage.deltaPercentage}%</span>
          ) : (
            <span className="ml-2 text-amber-400">↓ 0%</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function CommercialFunnelCard({
  stages,
  openCount,
  conversionRate,
}: {
  stages: CommercialFunnelStage[];
  openCount: number;
  conversionRate: string;
}) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="rounded-2xl bg-navy-950 p-8 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
            FUNIL COMERCIAL · PIPELINE ATIVO
          </p>
          <h3 className="mt-1 text-2xl font-bold">{openCount} em aberto</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{conversionRate}</p>
          <p className="text-xs text-slate-400">ganho / (ganho+perdido)</p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {stages.map((stage) => (
          <TrapezoidStage
            key={stage.label}
            stage={stage}
            widthPercent={Math.max((stage.value / maxValue) * 55, 12)}
          />
        ))}
      </div>
    </div>
  );
}
