"use client";

import type { AgendaWeek } from "@/lib/agenda";
import { formatBusyHours, totalBusyHours } from "@/lib/agenda";
import { cn } from "@/lib/cn";
import type { AgendaBlocksByPerson, AgendaPerson } from "@/types/agenda";
import { PersonAvatar } from "./PersonAvatar";
import { WeekSwitcher } from "./WeekSwitcher";

interface FillViewProps {
  week: AgendaWeek;
  people: AgendaPerson[];
  blocksByPerson: AgendaBlocksByPerson;
  confirmedIds: string[];
  onSelectPerson: (personId: string) => void;
  onOpenPanel: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

function PersonCard({
  person,
  blocksByPerson,
  confirmed,
  onSelect,
}: {
  person: AgendaPerson;
  blocksByPerson: AgendaBlocksByPerson;
  confirmed: boolean;
  onSelect: () => void;
}) {
  const hours = totalBusyHours(blocksByPerson[person.id]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-[0_16px_36px_-20px_rgba(15,23,42,0.45)]"
    >
      <PersonAvatar person={person} className="h-14 w-14 text-base" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-bold leading-tight text-slate-950">{person.name}</p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {!confirmed
            ? "Ainda não confirmou"
            : hours > 0
              ? `${formatBusyHours(hours)} bloqueados`
              : "Livre a semana toda"}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold",
          confirmed
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-600"
            : "border-amber-200 bg-amber-50/60 text-amber-600",
        )}
      >
        {confirmed ? "Confirmado" : "Pendente"}
      </span>
    </button>
  );
}

export function FillView({
  week,
  people,
  blocksByPerson,
  confirmedIds,
  onSelectPerson,
  onOpenPanel,
  onPreviousWeek,
  onNextWeek,
}: FillViewProps) {
  const confirmedCount = confirmedIds.length;
  const percent = people.length ? (confirmedCount / people.length) * 100 : 0;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] bg-navy-900 px-6 py-9 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.85)] sm:px-10 sm:py-11">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 opacity-25 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-400">{week.label}</p>
            <h1 className="text-3xl font-extrabold leading-[1.15] sm:text-[2.65rem]">
              Quando você <span className="text-brand-400">não</span> pode, de {week.range}
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
              Clique no seu nome e marque os horários em que estará ocupado de segunda a sexta. O resto da
              semana o time assume que você está livre.
            </p>
          </div>

          <div className="w-full shrink-0 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur lg:max-w-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[2rem] font-extrabold leading-none">
                {confirmedCount}
                <span className="text-lg font-semibold text-slate-400">/{people.length}</span>
              </span>
              <span className="text-sm text-slate-400">confirmaram</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div className="brand-gradient h-full rounded-full transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            <button
              type="button"
              onClick={onOpenPanel}
              className="brand-gradient mt-5 w-full rounded-full px-4 py-3 text-[15px] font-bold text-white transition hover:brightness-110"
            >
              Ver painel da semana
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-[1.75rem]">Quem é você?</h2>
          <WeekSwitcher week={week} onPrevious={onPreviousWeek} onNext={onNextWeek} className="self-start sm:self-auto" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              blocksByPerson={blocksByPerson}
              confirmed={confirmedIds.includes(person.id)}
              onSelect={() => onSelectPerson(person.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
