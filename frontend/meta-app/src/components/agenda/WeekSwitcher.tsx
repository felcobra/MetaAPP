"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AgendaWeek } from "@/lib/agenda";
import { cn } from "@/lib/cn";

interface WeekSwitcherProps {
  week: AgendaWeek;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function WeekSwitcher({ week, onPrevious, onNext, className }: WeekSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1.5 shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Semana anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="min-w-36 px-2 text-center">
        <p className="text-[15px] font-bold leading-tight text-slate-950">{week.label}</p>
        <p className="text-xs leading-tight text-slate-500">{week.range}</p>
      </div>
      <button
        type="button"
        onClick={onNext}
        aria-label="Próxima semana"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
