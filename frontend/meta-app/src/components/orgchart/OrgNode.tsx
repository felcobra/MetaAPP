import type { MouseEvent } from "react";
import type { OrgNode as OrgNodeData } from "@/types/orgchart";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/orgchart-layout";
import { cn } from "@/lib/cn";

interface OrgNodeProps {
  node: OrgNodeData;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function OrgNode({ node, x, y, isSelected, onSelect }: OrgNodeProps) {
  // Lets the click select the node without the canvas reading it as a pan.
  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={onSelect}
      aria-pressed={isSelected}
      /* Fixed box, so connectors always meet the exact centre of each edge. */
      style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={cn(
        "absolute flex -translate-x-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center",
        "text-sm font-medium leading-snug text-slate-800 shadow-sm transition-colors duration-150",
        "hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
        // ring instead of a thicker border, so selecting never shifts the layout
        isSelected && "border-blue-600 ring-1 ring-blue-600 hover:border-blue-600",
      )}
    >
      <span className="line-clamp-2 min-w-0">{node.title}</span>
    </button>
  );
}
