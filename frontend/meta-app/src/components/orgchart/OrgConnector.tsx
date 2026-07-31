import type { OrgEdge } from "@/lib/orgchart-layout";

/**
 * Square elbow: down from the parent's bottom edge, across at the midpoint of
 * the gap, then down to the child's top edge. Every edge of the same parent
 * shares that midpoint, so the horizontal segments line up into one clean bus.
 */
function buildPath({ from, to }: OrgEdge) {
  const midY = (from.y + to.y) / 2;

  if (from.x === to.x) {
    return `M${from.x},${from.y} V${to.y}`;
  }

  return `M${from.x},${from.y} V${midY} H${to.x} V${to.y}`;
}

export function OrgConnector({ edge }: { edge: OrgEdge }) {
  return (
    <path
      d={buildPath(edge)}
      fill="none"
      stroke="#d5dbe8"
      strokeWidth={1.5}
      strokeLinecap="square"
      /* Keeps the stroke exactly 1.5px at any zoom level. */
      vectorEffect="non-scaling-stroke"
    />
  );
}
