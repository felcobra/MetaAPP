import type { DeliveriesPoint } from "@/types/dashboard";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 12;
const PADDING_Y = 16;

function buildPath(points: DeliveriesPoint[]) {
  const max = Math.max(...points.map((point) => point.value));
  const min = 0;
  const stepX = (WIDTH - PADDING_X * 2) / (points.length - 1);

  const coords = points.map((point, index) => {
    const x = PADDING_X + stepX * index;
    const ratio = (point.value - min) / (max - min || 1);
    const y = HEIGHT - PADDING_Y - ratio * (HEIGHT - PADDING_Y * 2);
    return { x, y, point };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x},${coord.y}`)
    .join(" ");

  const areaPath = `${linePath} L${coords[coords.length - 1].x},${HEIGHT} L${coords[0].x},${HEIGHT} Z`;

  return { coords, linePath, areaPath };
}

export function DeliveriesLineChart({ data }: { data: DeliveriesPoint[] }) {
  const { coords, linePath, areaPath } = buildPath(data);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-56 w-full overflow-visible"
        role="img"
        aria-label="Gráfico de linha mostrando entregas por mês"
      >
        <defs>
          <linearGradient id="deliveries-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#deliveries-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map(({ x, y, point }) => (
          <circle
            key={point.month}
            cx={x}
            cy={y}
            r={3.5}
            fill="#2563eb"
            stroke="white"
            strokeWidth={1.5}
          >
            <desc>
              {point.month}: {point.value} entregas
            </desc>
          </circle>
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        {data.map((point) => (
          <span key={point.month}>{point.month}</span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Entregas por mês</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Entregas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}>
              <td>{point.month}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
