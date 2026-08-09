"use client";

import { useMemo, useState } from "react";
import { buildSuggestions, formatDuration, formatHour } from "@/lib/agenda";
import { cn } from "@/lib/cn";
import { agendaDurations } from "@/mocks/agenda";
import type { AgendaBlocksByPerson, AgendaDay, AgendaPerson } from "@/types/agenda";
import { PersonAvatar } from "./PersonAvatar";

interface BestSlotsProps {
  people: AgendaPerson[];
  blocksByPerson: AgendaBlocksByPerson;
  days: AgendaDay[];
}

export function BestSlots({ people, blocksByPerson, days }: BestSlotsProps) {
  const [durationId, setDurationId] = useState("1h");
  const [requiredIds, setRequiredIds] = useState<string[]>([]);

  const duration = agendaDurations.find((item) => item.id === durationId) ?? agendaDurations[1];

  const suggestions = useMemo(
    () =>
      buildSuggestions(people, blocksByPerson, days, {
        durationHours: duration.hours,
        requiredIds,
        limit: 6,
      }),
    [people, blocksByPerson, days, duration.hours, requiredIds],
  );

  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);

  function toggleRequired(personId: string) {
    setRequiredIds((current) =>
      current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] bg-navy-900 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.85)]">
      <div className="flex flex-col gap-5 border-b border-white/10 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-400">Melhores horários</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-[1.75rem]">Quando dá pra reunir o time</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Duração</span>
          <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
            {agendaDurations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDurationId(item.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  item.id === durationId
                    ? "bg-brand-500 text-white shadow-[0_8px_20px_-10px_rgba(33,150,243,0.9)]"
                    : "text-slate-300 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-slate-400">Precisa ter:</span>
          {people.map((person) => {
            const active = requiredIds.includes(person.id);
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => toggleRequired(person.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-brand-400 bg-brand-400/15 text-white"
                    : "border-white/15 text-slate-300 hover:border-white/35 hover:text-white",
                )}
              >
                {person.shortName}
              </button>
            );
          })}
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
            <p className="text-base font-semibold text-white">Nenhuma janela encontrada</p>
            <p className="mt-1 text-sm text-slate-400">
              Tente uma duração menor ou tire alguém da lista de presença obrigatória.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((suggestion, index) => {
              const busyNames = suggestion.busyIds
                .map((id) => peopleById.get(id)?.shortName)
                .filter(Boolean)
                .join(", ");

              return (
                <article
                  key={suggestion.id}
                  className={cn(
                    "rounded-2xl border p-5 transition",
                    index === 0
                      ? "border-brand-400/70 bg-white/[0.07]"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[17px] font-bold">
                      {suggestion.day.label}{" "}
                      <span className="text-sm font-semibold text-slate-400">{suggestion.day.date}</span>
                    </p>
                    <span className="shrink-0 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold">
                      {suggestion.freeIds.length}/{people.length}
                    </span>
                  </div>

                  <p className="mt-3 text-[1.6rem] font-extrabold leading-tight text-brand-400">
                    {formatHour(suggestion.start)} às {formatHour(suggestion.end)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    janela de {formatDuration(suggestion.end - suggestion.start)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {suggestion.freeIds.map((id) => {
                      const person = peopleById.get(id);
                      if (!person) return null;
                      return (
                        <PersonAvatar
                          key={id}
                          person={person}
                          className="h-8 w-8 text-[10px] ring-2 ring-navy-900"
                        />
                      );
                    })}
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {busyNames ? `Fora: ${busyNames}` : "Time completo disponível"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
