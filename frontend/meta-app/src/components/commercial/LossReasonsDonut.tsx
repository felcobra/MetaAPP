import type { LossReason } from "@/types/commercial";

const colorHexByClass: Record<string, string> = {
  "bg-red-400": "#f04b5f",
  "bg-amber-400": "#f6a623",
  "bg-indigo-400": "#7047f5",
  "bg-slate-400": "#737b9d",
  "bg-slate-300": "#c6cedd",
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
    // Diametro e espessura do anel acompanham a largura do card (@container do
    // LossReasonsCard), para a rosca nao roubar espaco da legenda com o menu aberto.
    <div className="flex shrink-0 flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-28 w-28 shrink-0 rounded-full @2xl:h-32 @2xl:w-32 @4xl:h-36 @4xl:w-36" style={{ backgroundImage: `conic-gradient(${segments.join(", ")})` }} role="img" aria-label={`Distribuicao de motivos de perda, total de ${total} perdas`}>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center @2xl:inset-6 @4xl:inset-7">
          <span className="text-lg font-extrabold text-slate-950 @2xl:text-xl @4xl:text-2xl">{total.toLocaleString("pt-BR")}</span>
          <span className="text-[10px] font-medium text-slate-400 @2xl:text-xs">perdas</span>
        </div>
      </div>
    </div>
  );
}
