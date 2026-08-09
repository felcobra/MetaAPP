"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  DAY_START,
  SLOTS_PER_DAY,
  SLOT_HOURS,
  blocksToSlots,
  dayIds,
  formatBusyHours,
  formatHour,
  slotsToBlocks,
  type AgendaWeek,
} from "@/lib/agenda";
import { cn } from "@/lib/cn";
import { agendaCategories, agendaCategoryMap } from "@/mocks/agenda";
import type { AgendaBlock, AgendaCategoryId, AgendaDayId, AgendaPerson } from "@/types/agenda";
import { PersonAvatar } from "./PersonAvatar";

interface AvailabilityEditorProps {
  person: AgendaPerson;
  week: AgendaWeek;
  blocks: AgendaBlock[];
  onClose: () => void;
  onSave: (blocks: AgendaBlock[]) => void;
}

type SlotsByDay = Record<AgendaDayId, (string | null)[]>;

function emptySlots(): SlotsByDay {
  return Object.fromEntries(
    dayIds.map((dayId) => [dayId, new Array<string | null>(SLOTS_PER_DAY).fill(null)]),
  ) as SlotsByDay;
}

export function AvailabilityEditor({ person, week, blocks, onClose, onSave }: AvailabilityEditorProps) {
  const [slots, setSlots] = useState<SlotsByDay>(() => blocksToSlots(blocks));
  const [category, setCategory] = useState<AgendaCategoryId>("aula");
  const [painting, setPainting] = useState<"paint" | "erase" | null>(null);

  useEffect(() => {
    function stop() {
      setPainting(null);
    }
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const totalHours = useMemo(
    () =>
      dayIds.reduce(
        (total, dayId) => total + slots[dayId].filter(Boolean).length * SLOT_HOURS,
        0,
      ),
    [slots],
  );

  function applySlot(dayId: AgendaDayId, index: number, mode: "paint" | "erase") {
    setSlots((current) => {
      const next = { ...current, [dayId]: [...current[dayId]] };
      next[dayId][index] = mode === "paint" ? category : null;
      return next;
    });
  }

  function startPainting(dayId: AgendaDayId, index: number) {
    const mode: "paint" | "erase" = slots[dayId][index] === category ? "erase" : "paint";
    setPainting(mode);
    applySlot(dayId, index, mode);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Agenda de ${person.name}`}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <PersonAvatar person={person} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold text-slate-950">{person.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Marque quando você <span className="font-semibold text-slate-700">não</span> pode, de {week.range}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 px-6 py-4 sm:px-8">
          <span className="mr-1 text-sm text-slate-500">Motivo:</span>
          {agendaCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={item.id === category}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                item.id === category
                  ? item.chipClass
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", item.dotClass)} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5 sm:px-8">
          <div className="min-w-[620px] touch-none select-none">
            <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(5,minmax(0,1fr))] gap-x-2 bg-white pb-3">
              <span />
              {week.days.map((day) => (
                <p key={day.id} className="text-center text-[13px] font-bold text-slate-950">
                  {day.shortLabel} <span className="font-medium text-slate-400">{day.date}</span>
                </p>
              ))}
            </div>

            <div className="space-y-[3px]">
              {Array.from({ length: SLOTS_PER_DAY }, (_, index) => {
                const hour = DAY_START + index * SLOT_HOURS;
                const isFullHour = Number.isInteger(hour);

                return (
                  <div key={index} className="grid grid-cols-[64px_repeat(5,minmax(0,1fr))] items-center gap-x-2">
                    <span
                      className={cn(
                        "pr-2 text-right text-[11px] font-semibold",
                        isFullHour ? "text-slate-500" : "text-transparent",
                      )}
                    >
                      {formatHour(hour)}
                    </span>
                    {week.days.map((day) => {
                      const value = slots[day.id][index];
                      const categoryStyle = value ? agendaCategoryMap.get(value as AgendaCategoryId) : null;

                      return (
                        <button
                          key={day.id}
                          type="button"
                          aria-label={`${day.label} ${formatHour(hour)}`}
                          aria-pressed={Boolean(value)}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            startPainting(day.id, index);
                          }}
                          onPointerEnter={() => {
                            if (painting) applySlot(day.id, index, painting);
                          }}
                          className={cn(
                            "h-5 rounded-[5px] transition-colors",
                            categoryStyle
                              ? cn(categoryStyle.blockClass, "shadow-sm")
                              : cn(
                                  "bg-emerald-50 hover:bg-emerald-100",
                                  isFullHour && "ring-1 ring-inset ring-emerald-100",
                                ),
                          )}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-slate-500">
            {totalHours > 0 ? (
              <>
                <span className="font-bold text-slate-900">{formatBusyHours(totalHours)}</span> bloqueados nesta
                semana. Clique e arraste para marcar.
              </>
            ) : (
              "Nenhum bloqueio marcado. Clique e arraste nos horários em que estará ocupado."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSlots(emptySlots())}
              className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpar semana
            </button>
            <button
              type="button"
              onClick={() => onSave(slotsToBlocks(slots))}
              className="brand-gradient h-11 rounded-full px-6 text-sm font-bold text-white transition hover:brightness-110"
            >
              Salvar e confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
