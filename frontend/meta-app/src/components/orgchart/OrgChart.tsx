"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrgNode as OrgNodeData } from "@/types/orgchart";
import { layoutOrgTree } from "@/lib/orgchart-layout";
import { usePanZoom } from "@/lib/use-pan-zoom";
import { ZoomControls } from "./ZoomControls";
import { OrgNode } from "./OrgNode";
import { OrgConnector } from "./OrgConnector";
import { OrgMembersPanel } from "./OrgMembersPanel";

export function OrgChart({ root }: { root: OrgNodeData }) {
  const layout = useMemo(() => layoutOrgTree(root), [root]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  function clearSelection() {
    setSelectedNodeId(null);
  }

  // Pressing empty canvas closes the panel; OrgNode stops its own mousedown.
  const { zoom, pan, isPanning, zoomIn, zoomOut, reset, surfaceProps } = usePanZoom(clearSelection);

  const selectedNode = layout.nodes.find((entry) => entry.node.id === selectedNodeId)?.node ?? null;
  const panelNode = selectedNode?.person || selectedNode?.team ? selectedNode : null;

  useEffect(() => {
    if (!panelNode) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedNodeId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelNode]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />

      <div
        className="h-[460px] w-full cursor-grab overflow-hidden active:cursor-grabbing sm:h-[560px] lg:h-[700px]"
        {...surfaceProps}
      >
        <div
          className="relative left-1/2 top-20"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translateX(-50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top center",
            transition: isPanning ? "none" : "transform 150ms ease-out",
          }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={layout.width}
            height={layout.height}
          >
            {layout.edges.map((edge, index) => (
              <OrgConnector key={index} edge={edge} />
            ))}
          </svg>

          {layout.nodes.map((entry) => (
            <OrgNode
              key={entry.node.id}
              node={entry.node}
              x={entry.x}
              y={entry.y}
              isSelected={entry.node.id === selectedNodeId}
              onSelect={() => setSelectedNodeId(entry.node.id)}
            />
          ))}
        </div>
      </div>

      {panelNode ? <OrgMembersPanel key={panelNode.id} node={panelNode} onClose={clearSelection} /> : null}

      <div className="pointer-events-none absolute bottom-5 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 truncate rounded-lg bg-slate-900/90 px-4 py-2 text-xs font-medium text-white">
        Arraste para navegar · use a roda para aplicar zoom
      </div>
    </div>
  );
}
