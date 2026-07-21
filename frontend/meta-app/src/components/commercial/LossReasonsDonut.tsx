import type { LossReason } from "@/types/commercial";

const colorHexByClass: Record<string, string> = {
  "bg-red-400": "#f87171",
  "bg-amber-400": "#fbbf24",
  "bg-indigo-400": "#818cf8",
  "bg-slate-400": "#94a3b8",
  "bg-slate-300": "#cbd5e1",
};

export function LossReasonsDonut({ reasons }: { reasons: LossReason[] }) {
  const total = reasons.reduce((sum, reason) => sum + reason.value, 0);

  const segments = reasons.reduce<{ cursor: number; parts: string[] }>(
    (acc, reason) => {
      const start = (acc.cursor / total) * 100;
      const nextCursor = acc.cursor + reason.value;
      const end = (nextCursor / total) * 100;
      const color = colorHexByClass[reason.colorClassName] ?? "#cbd5e1";
      return { cursor: nextCursor, parts: [...acc.parts, `${color} ${start}% ${end}%`] };
    },
    { cursor: 0, parts: [] },
  ).parts;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ backgroundImage: `conic-gradient(${segments.join(", ")})` }}
        role="img"
        aria-label={`Distribuição de motivos de perda, total de ${total} perdas`}
      >
        <div className="absolute inset-3.5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-2xl font-bold text-slate-900">{total.toLocaleString("pt-BR")}</span>
          <span className="text-xs font-medium text-slate-400">perdas</span>
        </div>
      </div>
    </div>
  );
}
