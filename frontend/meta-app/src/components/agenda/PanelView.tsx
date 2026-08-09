"use client";

import type { AgendaWeek } from "@/lib/agenda";
import type { AgendaBlocksByPerson, AgendaPerson } from "@/types/agenda";
import { BestSlots } from "./BestSlots";
import { WeekGrid } from "./WeekGrid";
import { WeekSwitcher } from "./WeekSwitcher";

interface PanelViewProps {
  week: AgendaWeek;
  people: AgendaPerson[];
  blocksByPerson: AgendaBlocksByPerson;
  confirmedIds: string[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export function PanelView({
  week,
  people,
  blocksByPerson,
  confirmedIds,
  onPreviousWeek,
  onNextWeek,
}: PanelViewProps) {
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Equipe de TI</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-[2.5rem]">Painel da semana</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            {week.range} · {confirmedIds.length} de {people.length} confirmaram
          </p>
        </div>
        <WeekSwitcher
          week={week}
          onPrevious={onPreviousWeek}
          onNext={onNextWeek}
          className="self-start lg:self-auto"
        />
      </section>

      <BestSlots people={people} blocksByPerson={blocksByPerson} days={week.days} />

      <WeekGrid people={people} blocksByPerson={blocksByPerson} days={week.days} />
    </div>
  );
}
