import type { MouseEvent } from "react";
import type { OrgNode as OrgNodeData } from "@/types/orgchart";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/orgchart-layout";
import type { OrgNodeEdicao } from "@/lib/use-orgchart-editor";
import { cn } from "@/lib/cn";

interface OrgNodeProps {
  node: OrgNodeData;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
  /** Presente apenas no modo de edição; fora dele o card fica exatamente como antes. */
  edicao?: OrgNodeEdicao;
}

export function OrgNode({ node, x, y, isSelected, onSelect, edicao }: OrgNodeProps) {
  // Lets the click select the node without the canvas reading it as a pan.
  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <button
      type="button"
      data-org-node={node.id}
      draggable={edicao?.arrastavel ?? false}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
      onDragStart={edicao?.onDragStart}
      onDragOver={edicao?.onDragOver}
      onDragLeave={edicao?.onDragLeave}
      onDrop={edicao?.onDrop}
      onDragEnd={edicao?.onDragEnd}
      aria-pressed={isSelected}
      /* Fixed box, so connectors always meet the exact centre of each edge. */
      style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={cn(
        "absolute flex -translate-x-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center",
        "text-sm font-medium leading-snug text-slate-800 shadow-sm transition-colors duration-150",
        "hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
        // ring instead of a thicker border, so selecting never shifts the layout
        isSelected && "border-blue-600 ring-1 ring-blue-600 hover:border-blue-600",
        // ── Modo de edição ──────────────────────────────────────────────────
        // Deixa claro o que pode ser arrastado (grab) e o que está fixo (raiz).
        edicao?.arrastavel && "cursor-grab",
        edicao && !edicao.arrastavel && "cursor-default",
        // Card em movimento: apagado, para o destaque ficar nos destinos.
        edicao?.arrastando && "opacity-40 ring-1 ring-blue-400",
        // Destinos que aceitam o card: borda tracejada discreta.
        edicao?.destinoPossivel && !edicao.destinoAtivo && "border-dashed border-blue-300",
        // Destino sob o cursor: confirmação forte de onde o card vai cair.
        edicao?.destinoAtivo && "border-blue-600 bg-blue-50 ring-2 ring-blue-500 hover:border-blue-600",
        // Movimento proibido (ele mesmo, própria equipe, gestor atual).
        edicao?.destinoInvalido && "border-amber-400 bg-amber-50 ring-2 ring-amber-400 hover:border-amber-400",
      )}
    >
      {/* Sem pointer-events o texto interno dispara dragleave e o destaque do
          destino fica piscando enquanto o cursor passa por cima dele. */}
      <span className={cn("line-clamp-2 min-w-0", edicao && "pointer-events-none")}>{node.title}</span>
    </button>
  );
}
