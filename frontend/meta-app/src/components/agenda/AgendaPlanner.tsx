"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Copy, RotateCcw, Save, Users } from "lucide-react";
import { agendaDays, agendaPeople, agendaSlots, agendaSuggestions, agendaWeek, initialBlockedSlots } from "@/mocks/agenda";
import type { AgendaPerson } from "@/types/agenda";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";

type AgendaView = "preencher" | "painel";

function slotKey(dayId: string, slotId: string) {
  return `${dayId}-${slotId}`;
}

function PersonCard({ person, active, onSelect }: { person: AgendaPerson; active: boolean; onSelect: () => void }) {
  const confirmed = person.status === "confirmed";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex min-w-0 items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg",
        active ? "border-cyan-400 ring-4 ring-cyan-100" : "border-slate-200",
      )}
    >
      <Avatar initials={person.initials} size="md" className={cn("ring-0", person.avatarTone)} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight text-slate-950">{person.name}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {confirmed ? `${person.blockedHours}h bloqueados` : "Ainda nao confirmou"}
        </p>
      </div>
      <Badge tone={confirmed ? "success" : "warning"}>{confirmed ? "Confirmado" : "Pendente"}</Badge>
    </button>
  );
}

function WeekSwitcher() {
  return (
    <div className="flex w-full items-center justify-between gap-1 rounded-full border border-slate-200 bg-white p-1 sm:w-auto">
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Semana anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-38 px-2 text-center">
        <p className="text-sm font-semibold leading-tight text-slate-950">{agendaWeek.label}</p>
        <p className="text-[11px] leading-tight text-slate-500">{agendaWeek.range}</p>
      </div>
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Proxima semana">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function AvailabilityGrid({ selectedPerson }: { selectedPerson: AgendaPerson }) {
  const [blocked, setBlocked] = useState<string[]>(initialBlockedSlots[selectedPerson.id] ?? []);
  const [saved, setSaved] = useState(false);

  function toggleSlot(key: string) {
    setSaved(false);
    setBlocked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function clearSlots() {
    setSaved(false);
    setBlocked([]);
  }

  return (
    <Card className="min-w-0 lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500">Preenchimento semanal</p>
          <h2 className="mt-1 break-words text-2xl font-bold text-slate-950">Agenda de {selectedPerson.name}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Marque apenas os horarios em que voce estara ocupado. Os demais ficam disponiveis para o time.
          </p>
        </div>
        <Badge tone={blocked.length > 0 ? "info" : "neutral"}>{blocked.length} bloqueios</Badge>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[720px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-[88px_repeat(5,minmax(104px,1fr))] gap-2">
            <div />
            {agendaDays.map((day) => (
              <div key={day.id} className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-950">{day.shortLabel}</p>
                <p className="text-[11px] text-slate-400">{day.date}</p>
              </div>
            ))}

            {agendaSlots.map((slot) => (
              <div key={slot.id} className="contents">
                <div className="flex items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {slot.label}
                </div>
                {agendaDays.map((day) => {
                  const key = slotKey(day.id, slot.id);
                  const isBlocked = blocked.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSlot(key)}
                      className={cn(
                        "min-h-11 rounded-xl border px-3 text-xs font-semibold transition",
                        isBlocked
                          ? "border-cyan-500 bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                          : "border-slate-200 bg-white text-slate-400 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700",
                      )}
                    >
                      {isBlocked ? "Ocupado" : "Livre"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{saved ? "Disponibilidade salva nesta sessao." : "Alteracoes locais ainda nao salvas."}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={clearSlots} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Limpar
          </button>
          <button type="button" onClick={() => setSaved(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 text-sm font-semibold text-white transition hover:brightness-110">
            <Save className="h-4 w-4" /> Salvar horarios
          </button>
        </div>
      </div>
    </Card>
  );
}

function TeamPanel({ confirmedCount, totalCount }: { confirmedCount: number; totalCount: number }) {
  const percent = Math.round((confirmedCount / totalCount) * 100);
  const pending = agendaPeople.filter((person) => person.status === "pending");

  return (
    <div className="space-y-5">
      <Card className="bg-slate-950 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Confirmacoes</p>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-bold">{confirmedCount}<span className="text-base font-medium text-slate-400">/{totalCount}</span></span>
          <span className="text-xs text-slate-400">confirmaram</span>
        </div>
        <ProgressBar value={percent} className="mt-4" trackClassName="bg-white/20" />
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Pendentes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pending.map((person) => (
            <span key={person.id} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{person.name}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DashboardPanel({ confirmedCount, totalCount }: { confirmedCount: number; totalCount: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500">Painel da semana</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Melhores horarios para reunir</h2>
          </div>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <Copy className="h-4 w-4" /> Copiar resumo
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {agendaSuggestions.map((suggestion) => {
            const percent = Math.round((suggestion.available / suggestion.total) * 100);
            return (
              <div key={suggestion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">{suggestion.day}, {suggestion.time}</p>
                    <p className="text-sm text-slate-500">{suggestion.note}</p>
                  </div>
                  <Badge tone="success">{suggestion.available}/{suggestion.total} livres</Badge>
                </div>
                <ProgressBar value={percent} className="mt-3" />
              </div>
            );
          })}
        </div>
      </Card>

      <TeamPanel confirmedCount={confirmedCount} totalCount={totalCount} />
    </div>
  );
}

export function AgendaPlanner() {
  const [view, setView] = useState<AgendaView>("preencher");
  const [selectedPersonId, setSelectedPersonId] = useState(agendaPeople[2].id);
  const selectedPerson = agendaPeople.find((person) => person.id === selectedPersonId) ?? agendaPeople[0];
  const confirmedCount = useMemo(() => agendaPeople.filter((person) => person.status === "confirmed").length, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 opacity-25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Esta semana</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Quando voce nao pode, de {agendaWeek.range}</h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Clique no seu nome, marque indisponibilidades de segunda a sexta e veja os melhores horarios para o time se reunir.
            </p>
          </div>
          <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{confirmedCount}<span className="text-base font-medium text-slate-400">/{agendaPeople.length}</span></span>
              <span className="text-xs text-slate-400">confirmaram</span>
            </div>
            <ProgressBar value={(confirmedCount / agendaPeople.length) * 100} className="mt-3" trackClassName="bg-white/20" />
            <button onClick={() => setView("painel")} className="mt-4 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
              Ver painel da semana
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full bg-slate-200/70 p-1">
          <button onClick={() => setView("preencher")} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", view === "preencher" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800")}>Preencher</button>
          <button onClick={() => setView("painel")} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", view === "painel" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-800")}>Painel</button>
        </div>
        <WeekSwitcher />
      </section>

      {view === "preencher" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              <h2 className="text-xl font-semibold text-slate-950">Quem e voce?</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {agendaPeople.map((person) => (
                <PersonCard key={person.id} person={person} active={person.id === selectedPersonId} onSelect={() => setSelectedPersonId(person.id)} />
              ))}
            </div>
          </section>
          <AvailabilityGrid selectedPerson={selectedPerson} />
        </div>
      ) : (
        <DashboardPanel confirmedCount={confirmedCount} totalCount={agendaPeople.length} />
      )}

      <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        Agenda TI, uso interno da Meta Consultoria. Sem login: preencha so o seu nome.
      </footer>
    </div>
  );
}
