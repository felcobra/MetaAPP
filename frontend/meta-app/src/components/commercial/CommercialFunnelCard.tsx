import type { CommercialFunnelStage } from "@/types/commercial";

const STAGE_COLORS = ["#8FDDFF", "#43BFF1", "#1789EF", "#0866D8", "#0644B4", "#0B3588"];

/** Funnel geometry, in SVG user units. One stage = one slice of STAGE_HEIGHT. */
const VIEW_WIDTH = 440;
const CENTER = VIEW_WIDTH / 2;
const STAGE_HEIGHT = 74;
const STAGE_GAP = 9;
const TOP_WIDTH = 424;
const TIP_WIDTH = 28;

/** Smooth taper: wide mouth on top, small tip at the bottom. */
function widthAt(progress: number) {
  return TIP_WIDTH + (TOP_WIDTH - TIP_WIDTH) * Math.pow(1 - progress, 1.35);
}

/** Vertical radius of the elliptical cap, so wide slices read as thicker cylinders. */
function rimRadius(width: number) {
  return Math.max(4, width * 0.055);
}

function FunnelSvg({ stages }: { stages: CommercialFunnelStage[] }) {
  const viewHeight = stages.length * STAGE_HEIGHT;
  const bodyHeight = STAGE_HEIGHT - STAGE_GAP;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="Funil comercial"
    >
      <defs>
        {/* Cylindrical shading: shadow on both edges, highlight slightly left of center. */}
        <linearGradient id="funnel-cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#041634" stopOpacity="0.55" />
          <stop offset="10%" stopColor="#041634" stopOpacity="0.26" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="84%" stopColor="#041634" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#041634" stopOpacity="0.58" />
        </linearGradient>

        {/* Glossy top rim. */}
        <linearGradient id="funnel-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#CBEBFF" />
          <stop offset="42%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#9FD4F7" />
        </linearGradient>

        <filter id="funnel-shadow" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#020617" floodOpacity="0.32" />
        </filter>
      </defs>

      {stages.map((stage, index) => {
        const top = index * STAGE_HEIGHT;
        const bottom = top + bodyHeight;
        const topWidth = widthAt(index / stages.length);
        const nextWidth = widthAt((index + 1) / stages.length);
        const bottomWidth = topWidth + (nextWidth - topWidth) * (bodyHeight / STAGE_HEIGHT);
        const topRim = rimRadius(topWidth);
        const bottomRim = rimRadius(bottomWidth);

        const body = [
          `M ${CENTER - topWidth / 2} ${top}`,
          `Q ${CENTER} ${top + topRim * 1.34} ${CENTER + topWidth / 2} ${top}`,
          `L ${CENTER + bottomWidth / 2} ${bottom}`,
          `Q ${CENTER} ${bottom + bottomRim * 1.34} ${CENTER - bottomWidth / 2} ${bottom}`,
          "Z",
        ].join(" ");

        return (
          <g key={stage.label} filter="url(#funnel-shadow)">
            <path d={body} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
            <path d={body} fill="url(#funnel-cylinder)" />
            <ellipse cx={CENTER} cy={top} rx={topWidth / 2} ry={topRim} fill="url(#funnel-rim)" opacity="0.92" />
            <text
              x={CENTER}
              y={(top + bottom) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[26px] font-black"
            >
              {stage.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StageRow({ stage }: { stage: CommercialFunnelStage }) {
  return (
    <div className="flex min-w-0 items-center">
      <span className="h-px w-3 shrink-0 bg-blue-500/70 @xl:w-6 @2xl:w-8 @3xl:w-10" />
      <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 ring-4 ring-cyan-400/15 @xl:h-2.5 @xl:w-2.5" />
      <div className="min-w-0 flex-1 pl-2.5 @xl:pl-3.5">
        <p className="truncate text-xs font-extrabold leading-tight text-white @xl:text-sm @2xl:text-[15px]">
          {stage.label}
        </p>
        {/* A variacao percentual por fase saiu: exigiria comparar com o
            periodo anterior, e oportunidade.criado_em e nullable numa parte
            relevante dos registros importados do Pipefy. */}
        <div className="mt-0.5 flex items-baseline justify-between gap-2 @xl:gap-3">
          <span className="truncate text-[11px] text-slate-400 @xl:text-[13px] @2xl:text-sm">
            {stage.value} {stage.value === 1 ? "oportunidade" : "oportunidades"}
          </span>
        </div>
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
  return (
    <div className="@container flex min-w-0 flex-col overflow-hidden rounded-[26px] bg-[#121936] p-5 text-white shadow-xl @md:p-6 @2xl:p-7 @3xl:p-8">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2 @md:gap-x-5 @md:gap-y-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-300 @md:text-xs @2xl:text-sm @2xl:tracking-[0.18em]">
            Funil comercial - pipeline ativo
          </p>
          <h3 className="mt-1.5 text-xl font-extrabold @md:mt-2 @xl:text-2xl">{openCount} em aberto</h3>
        </div>
        <div className="shrink-0 text-left @md:text-right">
          <p className="text-2xl font-extrabold leading-none @xl:text-3xl @2xl:text-4xl">{conversionRate}</p>
          <p className="mt-1.5 text-xs text-slate-400 @md:mt-2 @xl:text-sm">ganho / (ganho+perdido)</p>
        </div>
      </div>

      {/* Side-by-side ja a partir de @md: com o menu aberto este card fica em torno
          de 32rem, e o layout precisa continuar o mesmo — quem cede sao as fontes
          e os espacamentos das linhas, nao o arranjo. Container queries, e nao
          viewport: a barra lateral muda a largura deste card, nao a da janela.

          Rows are equal fractions of the SVG height, so each connector meets the
          centre of its funnel slice. Top padding absorbs the rim's overflow. Each
          row stays single-line (truncate) so it never outgrows its funnel slice. */}
      <div className="mt-6 grid min-w-0 flex-1 items-center gap-y-5 pt-4 @md:mt-5 @md:grid-cols-[minmax(140px,1fr)_minmax(0,1.12fr)] @md:grid-rows-6 @md:gap-x-3.5 @md:gap-y-0 @md:pb-3 @xl:mt-6 @xl:gap-x-5 @xl:pt-6 @xl:pb-4 @3xl:gap-x-7">
        <div className="mx-auto w-full min-w-0 max-w-[320px] @md:row-span-6 @md:mx-0 @md:max-w-none">
          <FunnelSvg stages={stages} />
        </div>

        {stages.map((stage) => (
          <StageRow key={stage.label} stage={stage} />
        ))}
      </div>
    </div>
  );
}
