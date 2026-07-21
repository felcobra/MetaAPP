import type { OrgNode } from "@/types/orgchart";
import { NODE_WIDTH } from "@/lib/orgchart-layout";
import { cn } from "@/lib/cn";

interface OrgNodeCardProps {
  node: OrgNode;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function OrgNodeCard({ node, x, y, isSelected, onSelect }: OrgNodeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ left: x, top: y, width: NODE_WIDTH }}
      className={cn(
        "absolute -translate-x-1/2 rounded-xl border bg-white px-4 py-3 text-center text-sm font-medium shadow-sm transition-colors",
        isSelected
          ? "border-blue-500 text-blue-700 ring-2 ring-blue-100"
          : "border-slate-200 text-slate-700 hover:border-blue-300",
      )}
    >
      {node.title}
    </button>
  );
}
