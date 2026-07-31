export type AgendaStatus = "confirmed" | "pending";

export interface AgendaPerson {
  id: string;
  name: string;
  initials: string;
  status: AgendaStatus;
  blockedHours: number;
  avatarTone: string;
}

export interface AgendaDay {
  id: string;
  label: string;
  shortLabel: string;
  date: string;
}

export interface AgendaSlot {
  id: string;
  label: string;
}

export interface AgendaSuggestion {
  id: string;
  day: string;
  time: string;
  available: number;
  total: number;
  note: string;
}
