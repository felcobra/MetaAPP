"use client";

import { useMemo, useState } from "react";
import { getWeek } from "@/lib/agenda";
import { agendaPeople, initialAgendaBlocks, initialConfirmed } from "@/mocks/agenda";
import type { AgendaBlock, AgendaBlocksByPerson } from "@/types/agenda";
import { AgendaHeader, type AgendaView } from "./AgendaHeader";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { FillView } from "./FillView";
import { PanelView } from "./PanelView";

export function AgendaPlanner() {
  const [view, setView] = useState<AgendaView>("preencher");
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const week = useMemo(() => getWeek(weekOffset), [weekOffset]);
  const currentWeekKey = useMemo(() => getWeek(0).key, []);

  const [blocksByWeek, setBlocksByWeek] = useState<Record<string, AgendaBlocksByPerson>>(() => ({
    [getWeek(0).key]: initialAgendaBlocks,
  }));
  const [confirmedByWeek, setConfirmedByWeek] = useState<Record<string, string[]>>(() => ({
    [getWeek(0).key]: initialConfirmed,
  }));

  const blocksByPerson = blocksByWeek[week.key] ?? {};
  const confirmedIds = confirmedByWeek[week.key] ?? [];

  const editingPerson = agendaPeople.find((person) => person.id === editingId) ?? null;

  function saveBlocks(personId: string, blocks: AgendaBlock[]) {
    setBlocksByWeek((current) => ({
      ...current,
      [week.key]: { ...(current[week.key] ?? {}), [personId]: blocks },
    }));
    setConfirmedByWeek((current) => {
      const list = current[week.key] ?? [];
      if (list.includes(personId)) return current;
      return { ...current, [week.key]: [...list, personId] };
    });
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-[#f4f7fd]">
      <AgendaHeader view={view} onChangeView={setView} />

      <main className="mx-auto w-full max-w-[1560px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {view === "preencher" ? (
          <FillView
            week={week}
            people={agendaPeople}
            blocksByPerson={blocksByPerson}
            confirmedIds={confirmedIds}
            onSelectPerson={setEditingId}
            onOpenPanel={() => setView("painel")}
            onPreviousWeek={() => setWeekOffset((current) => current - 1)}
            onNextWeek={() => setWeekOffset((current) => current + 1)}
          />
        ) : (
          <PanelView
            week={week}
            people={agendaPeople}
            blocksByPerson={blocksByPerson}
            confirmedIds={confirmedIds}
            onPreviousWeek={() => setWeekOffset((current) => current - 1)}
            onNextWeek={() => setWeekOffset((current) => current + 1)}
          />
        )}

        {week.key !== currentWeekKey && confirmedIds.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            Ninguém preencheu {week.label.toLowerCase()} ainda.
          </p>
        ) : null}
      </main>

      {editingPerson ? (
        <AvailabilityEditor
          person={editingPerson}
          week={week}
          blocks={blocksByPerson[editingPerson.id] ?? []}
          onClose={() => setEditingId(null)}
          onSave={(blocks) => saveBlocks(editingPerson.id, blocks)}
        />
      ) : null}
    </div>
  );
}
