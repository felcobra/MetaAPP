import {
  DAY_END,
  DAY_START,
  blocksOfDay,
  formatBusyHours,
  formatHour,
  totalBusyHours,
} from "@/lib/agenda";
import { cn } from "@/lib/cn";
import { agendaCategories, agendaCategoryMap } from "@/mocks/agenda";
import type { AgendaBlocksByPerson, AgendaDay, AgendaPerson } from "@/types/agenda";
import { PersonAvatar } from "./PersonAvatar";

interface WeekGridProps {
  people: AgendaPerson[];
  blocksByPerson: AgendaBlocksByPerson;
  days: AgendaDay[];
}

const HOUR_TICKS = [8, 12, 16, 20];
const TOTAL_HOURS = DAY_END - DAY_START;

function percentOf(hour: number) {
  return ((hour - DAY_START) / TOTAL_HOURS) * 100;
}

export function WeekGrid({ people, blocksByPerson, days }: WeekGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="text-2xl font-extrabold text-slate-950 sm:text-[1.75rem]">Grade da semana</h2>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {agendaCategories.map((category) => (
            <li key={category.id} className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className={cn("h-2.5 w-2.5 rounded-full", category.dotClass)} />
              {category.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[240px_repeat(5,minmax(0,1fr))] items-end gap-x-4 border-b border-slate-200/70 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Membro</p>
            {days.map((day) => (
              <div key={day.id}>
                <p className="text-[15px] font-bold text-slate-950">
                  {day.shortLabel} <span className="text-sm font-medium text-slate-400">{day.date}</span>
                </p>
                <div className="relative mt-2 h-4">
                  {HOUR_TICKS.map((hour) => (
                    <span
                      key={hour}
                      className="absolute top-0 -translate-x-1/2 text-[11px] font-medium text-slate-400"
                      style={{ left: `${percentOf(hour)}%` }}
                    >
                      {hour}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {people.map((person) => {
            const blocks = blocksByPerson[person.id] ?? [];
            const hours = totalBusyHours(blocks);

            return (
              <div
                key={person.id}
                className="grid grid-cols-[240px_repeat(5,minmax(0,1fr))] items-center gap-x-4 border-b border-slate-100 px-5 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar person={person} className="h-10 w-10 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold leading-tight text-slate-950">{person.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {hours > 0 ? `${formatBusyHours(hours)} ocupado` : "livre a semana toda"}
                    </p>
                  </div>
                </div>

                {days.map((day) => (
                  <div key={day.id} className="relative h-9 rounded-lg bg-emerald-50/70">
                    {blocksOfDay(blocks, day.id).map((item) => {
                      const category = agendaCategoryMap.get(item.category);
                      return (
                        <span
                          key={`${item.dayId}-${item.start}-${item.end}`}
                          className={cn(
                            "absolute inset-y-1 rounded-md",
                            category?.blockClass ?? "bg-slate-500",
                          )}
                          style={{
                            left: `${percentOf(item.start)}%`,
                            width: `${((item.end - item.start) / TOTAL_HOURS) * 100}%`,
                          }}
                          title={`${category?.label ?? "Ocupado"} · ${formatHour(item.start)} às ${formatHour(item.end)}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
