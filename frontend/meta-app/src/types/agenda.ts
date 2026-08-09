export type AgendaDayId = "seg" | "ter" | "qua" | "qui" | "sex";

export type AgendaCategoryId =
  | "aula"
  | "trabalho"
  | "cliente"
  | "saude"
  | "pessoal"
  | "viagem"
  | "outro";

export interface AgendaCategory {
  id: AgendaCategoryId;
  label: string;
  /** cor do ponto na legenda */
  dotClass: string;
  /** cor do bloco na grade da semana */
  blockClass: string;
  /** estado ativo do seletor de categoria no editor */
  chipClass: string;
}

export interface AgendaBlock {
  dayId: AgendaDayId;
  /** hora decimal, ex.: 13.5 = 13:30 */
  start: number;
  end: number;
  category: AgendaCategoryId;
}

export interface AgendaPerson {
  id: string;
  name: string;
  /** primeiro nome, usado em chips e na lista "Fora:" */
  shortName: string;
  initials: string;
  /** gradiente de fallback quando nao existe foto */
  toneClass: string;
  photoUrl?: string;
}

export interface AgendaDay {
  id: AgendaDayId;
  label: string;
  shortLabel: string;
  /** ex.: "03/08" */
  date: string;
}

export interface AgendaSuggestion {
  id: string;
  day: AgendaDay;
  start: number;
  end: number;
  freeIds: string[];
  busyIds: string[];
}

export type AgendaBlocksByPerson = Record<string, AgendaBlock[]>;
