"use client";

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Maximize, Minus, Plus } from "lucide-react";
import type { OrgNode } from "@/types/orgchart";
import { layoutOrgTree } from "@/lib/orgchart-layout";
import { OrgNodeCard } from "./OrgNodeCard";
import { OrgProfileOverlay } from "./OrgProfileOverlay";
import { OrgTeamOverlay } from "./OrgTeamOverlay";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;

export function OrgChartCanvas({ root }: { root: OrgNode }) {
  const layout = useMemo(() => layoutOrgTree(root), [root]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const selectedNode = layout.nodes.find((entry) => entry.node.id === selectedNodeId);

  function handlePointerDown(event: ReactMouseEvent<HTMLDivElement>) {
    setIsPanning(true);
    lastPointer.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!isPanning) return;
    const deltaX = event.clientX - lastPointer.current.x;
    const deltaY = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
  }

  function stopDragging() {
    setIsPanning(false);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current - event.deltaY * 0.001)),
    );
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + 0.1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Aumentar zoom"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - 0.1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Diminuir zoom"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Ajustar à tela"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-semibold text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div
        className="h-155 w-full cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onWheel={handleWheel}
      >
        <div
          className="relative left-1/2 top-10"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translateX(-50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top center",
            transition: isPanning ? "none" : "transform 120ms ease-out",
          }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={layout.width}
            height={layout.height}
          >
            {layout.edges.map((edge, index) => {
              const midY = (edge.from.y + edge.to.y) / 2;
              return (
                <path
                  key={index}
                  d={`M${edge.from.x},${edge.from.y} L${edge.from.x},${midY} L${edge.to.x},${midY} L${edge.to.x},${edge.to.y}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>

          {layout.nodes.map((entry) => (
            <OrgNodeCard
              key={entry.node.id}
              node={entry.node}
              x={entry.x}
              y={entry.y}
              isSelected={entry.node.id === selectedNodeId}
              onSelect={() => setSelectedNodeId(entry.node.id)}
            />
          ))}

          {selectedNode?.node.person ? (
            <OrgProfileOverlay
              person={selectedNode.node.person}
              x={selectedNode.x}
              y={selectedNode.y}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : null}

          {selectedNode?.node.team ? (
            <OrgTeamOverlay
              team={selectedNode.node.team}
              x={selectedNode.x}
              y={selectedNode.y}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900/85 px-4 py-2 text-xs font-medium text-white">
        Arraste para navegar · use a roda para aplicar zoom
      </div>
    </div>
  );
}
