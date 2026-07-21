import type { ProposalFunnelStage } from "@/types/dashboard";

export function ProposalFunnelBars({ stages }: { stages: ProposalFunnelStage[] }) {
  return (
    <div className="space-y-3">
      {stages.map((stage) => (
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
  );
}
