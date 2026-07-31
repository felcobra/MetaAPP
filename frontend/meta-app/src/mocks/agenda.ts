import type { AgendaDay, AgendaPerson, AgendaSlot, AgendaSuggestion } from "@/types/agenda";

export const agendaWeek = {
  label: "Esta semana",
  range: "27 a 31 de julho",
  previousHref: "?semana=2026-07-20",
  nextHref: "?semana=2026-08-03",
};

export const agendaDays: AgendaDay[] = [
  { id: "seg", label: "Segunda", shortLabel: "Seg", date: "27/07" },
  { id: "ter", label: "Terca", shortLabel: "Ter", date: "28/07" },
  { id: "qua", label: "Quarta", shortLabel: "Qua", date: "29/07" },
  { id: "qui", label: "Quinta", shortLabel: "Qui", date: "30/07" },
  { id: "sex", label: "Sexta", shortLabel: "Sex", date: "31/07" },
];

export const agendaSlots: AgendaSlot[] = [
  { id: "08", label: "08:00" },
  { id: "09", label: "09:00" },
  { id: "10", label: "10:00" },
  { id: "11", label: "11:00" },
  { id: "13", label: "13:00" },
  { id: "14", label: "14:00" },
  { id: "15", label: "15:00" },
  { id: "16", label: "16:00" },
  { id: "17", label: "17:00" },
];

export const agendaPeople: AgendaPerson[] = [
  { id: "cesar", name: "Cesar", initials: "CE", status: "pending", blockedHours: 0, avatarTone: "bg-amber-100 text-amber-700" },
  { id: "davi-mattos", name: "Davi Mattos", initials: "DM", status: "pending", blockedHours: 0, avatarTone: "bg-blue-100 text-blue-700" },
  { id: "felipe-cabral", name: "Felipe Cabral", initials: "FC", status: "confirmed", blockedHours: 24, avatarTone: "bg-sky-100 text-sky-700" },
  { id: "handerson", name: "Handerson", initials: "HA", status: "confirmed", blockedHours: 0, avatarTone: "bg-emerald-100 text-emerald-700" },
  { id: "heitor-lebre", name: "Heitor Lebre", initials: "HL", status: "confirmed", blockedHours: 21.5, avatarTone: "bg-indigo-100 text-indigo-700" },
  { id: "lucas-diniz", name: "Lucas Diniz", initials: "LD", status: "confirmed", blockedHours: 24, avatarTone: "bg-cyan-100 text-cyan-700" },
  { id: "marcos-moreira", name: "Marcos Moreira", initials: "MM", status: "confirmed", blockedHours: 2, avatarTone: "bg-violet-100 text-violet-700" },
  { id: "nathan", name: "Nathan", initials: "NA", status: "confirmed", blockedHours: 3, avatarTone: "bg-teal-100 text-teal-700" },
  { id: "paula-monteiro", name: "Paula Monteiro", initials: "PM", status: "pending", blockedHours: 0, avatarTone: "bg-rose-100 text-rose-700" },
  { id: "renan", name: "Renan", initials: "RE", status: "pending", blockedHours: 0, avatarTone: "bg-orange-100 text-orange-700" },
  { id: "roberth", name: "Roberth", initials: "RO", status: "pending", blockedHours: 0, avatarTone: "bg-slate-100 text-slate-700" },
  { id: "pimentel", name: "Pimentel", initials: "PI", status: "pending", blockedHours: 0, avatarTone: "bg-blue-100 text-blue-700" },
];

export const initialBlockedSlots: Record<string, string[]> = {
  "felipe-cabral": ["seg-08", "seg-09", "seg-10", "ter-13", "ter-14", "qua-15", "qui-16", "sex-10"],
  "heitor-lebre": ["seg-13", "ter-09", "ter-10", "qua-08", "qua-09", "qui-14", "sex-16"],
  "lucas-diniz": ["seg-15", "ter-15", "qua-15", "qui-15", "sex-15", "sex-16"],
  "marcos-moreira": ["qua-11", "qui-11"],
  "nathan": ["seg-17", "ter-17", "qua-17"],
};

export const agendaSuggestions: AgendaSuggestion[] = [
  { id: "s1", day: "Quarta", time: "10:00 - 11:00", available: 10, total: 12, note: "Melhor encaixe da semana" },
  { id: "s2", day: "Quinta", time: "09:00 - 10:00", available: 9, total: 12, note: "Bom para reuniao rapida" },
  { id: "s3", day: "Sexta", time: "13:00 - 14:00", available: 8, total: 12, note: "Atencao a pendentes" },
];
