import type { ComponentType } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute left-5 top-5 z-10 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <ControlButton icon={Plus} label="Aumentar zoom" onClick={onZoomIn} />
      <ControlButton icon={Minus} label="Diminuir zoom" onClick={onZoomOut} />
      <ControlButton icon={Maximize} label="Ajustar à tela" onClick={onReset} />
      <span className="min-w-[3rem] px-2 text-center text-sm font-bold text-slate-700">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
