import type {
  AgendaBlock,
  AgendaBlocksByPerson,
  AgendaCategory,
  AgendaCategoryId,
  AgendaDayId,
  AgendaPerson,
} from "@/types/agenda";

export const agendaCategories: AgendaCategory[] = [
  {
    id: "aula",
    label: "Aula / Faculdade",
    dotClass: "bg-indigo-500",
    blockClass: "bg-indigo-500",
    chipClass: "border-indigo-500 bg-indigo-50 text-indigo-700",
  },
  {
    id: "trabalho",
    label: "Trabalho / Estágio",
    dotClass: "bg-sky-500",
    blockClass: "bg-sky-500",
    chipClass: "border-sky-500 bg-sky-50 text-sky-700",
  },
  {
    id: "cliente",
    label: "Reunião com cliente",
    dotClass: "bg-purple-500",
    blockClass: "bg-purple-500",
    chipClass: "border-purple-500 bg-purple-50 text-purple-700",
  },
  {
    id: "saude",
    label: "Saúde / Consulta",
    dotClass: "bg-emerald-500",
    blockClass: "bg-emerald-500",
    chipClass: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    id: "pessoal",
    label: "Compromisso pessoal",
    dotClass: "bg-amber-500",
    blockClass: "bg-amber-500",
    chipClass: "border-amber-500 bg-amber-50 text-amber-700",
  },
  {
    id: "viagem",
    label: "Viagem / Fora da cidade",
    dotClass: "bg-rose-500",
    blockClass: "bg-rose-500",
    chipClass: "border-rose-500 bg-rose-50 text-rose-700",
  },
  {
    id: "outro",
    label: "Outro",
    dotClass: "bg-slate-500",
    blockClass: "bg-slate-500",
    chipClass: "border-slate-500 bg-slate-100 text-slate-700",
  },
];

export const agendaCategoryMap = new Map(agendaCategories.map((item) => [item.id, item]));

export const agendaPeople: AgendaPerson[] = [
  { id: "cesar", name: "César", shortName: "César", initials: "CE", toneClass: "from-amber-400 to-orange-500" },
  { id: "davi-mattos", name: "Davi Mattos", shortName: "Davi", initials: "DM", toneClass: "from-sky-400 to-blue-600" },
  { id: "felipe-cabral", name: "Felipe Cabral", shortName: "Felipe", initials: "FC", toneClass: "from-slate-300 to-slate-500" },
  { id: "handerson", name: "Handerson", shortName: "Handerson", initials: "HA", toneClass: "from-emerald-400 to-teal-600" },
  { id: "heitor-lebre", name: "Heitor Lebre", shortName: "Heitor", initials: "HL", toneClass: "from-rose-400 to-red-600" },
  { id: "lucas-diniz", name: "Lucas Diniz", shortName: "Lucas", initials: "LD", toneClass: "from-cyan-400 to-sky-600" },
  { id: "marcos-moreira", name: "Marcos Moreira", shortName: "Marcos", initials: "MM", toneClass: "from-blue-400 to-indigo-600" },
  { id: "nathan", name: "Nathan", shortName: "Nathan", initials: "NA", toneClass: "from-stone-400 to-stone-600" },
  { id: "paula-monteiro", name: "Paula Monteiro", shortName: "Paula", initials: "PM", toneClass: "from-lime-400 to-emerald-600" },
  { id: "renan", name: "Renan", shortName: "Renan", initials: "RE", toneClass: "from-fuchsia-400 to-pink-600" },
  { id: "roberth", name: "Roberth", shortName: "Roberth", initials: "RO", toneClass: "from-violet-400 to-purple-600" },
  { id: "pimentel", name: "Pimentel", shortName: "Pimentel", initials: "PI", toneClass: "from-sky-300 to-cyan-500" },
];

function block(dayId: AgendaDayId, start: number, end: number, category: AgendaCategoryId): AgendaBlock {
  return { dayId, start, end, category };
}

export const initialAgendaBlocks: AgendaBlocksByPerson = {
  cesar: [
    block("seg", 14, 18, "aula"),
    block("seg", 20, 22, "aula"),
    block("ter", 9, 13, "aula"),
    block("qua", 14, 15, "aula"),
    block("qua", 18, 22, "aula"),
    block("qui", 8, 12, "aula"),
    block("sex", 8, 11, "aula"),
  ],
  "davi-mattos": [
    block("seg", 13, 15, "aula"),
    block("seg", 16, 22, "aula"),
    block("ter", 10, 12, "aula"),
    block("ter", 15, 17, "aula"),
    block("qua", 12, 14, "aula"),
    block("qui", 9, 11, "aula"),
    block("qui", 16, 20, "aula"),
  ],
  "felipe-cabral": [
    block("seg", 7, 13, "aula"),
    block("ter", 7, 13, "aula"),
    block("qua", 7, 13, "aula"),
    block("qui", 7, 13, "aula"),
    block("sex", 7, 13, "aula"),
  ],
  handerson: [],
  "heitor-lebre": [
    block("seg", 13, 18, "trabalho"),
    block("ter", 7, 11, "aula"),
    block("ter", 12, 14, "trabalho"),
    block("ter", 14, 17, "cliente"),
    block("qua", 12, 16, "trabalho"),
    block("qui", 7, 12, "aula"),
    block("sex", 10, 12, "outro"),
  ],
  "lucas-diniz": [
    block("seg", 7, 8, "outro"),
    block("seg", 16, 22, "aula"),
    block("ter", 17, 22, "aula"),
    block("qua", 16, 22, "aula"),
    block("sex", 8, 10, "outro"),
  ],
  "marcos-moreira": [
    block("seg", 14, 19, "aula"),
    block("ter", 17, 22, "aula"),
    block("qua", 16, 22, "aula"),
    block("qui", 16, 22, "aula"),
  ],
  nathan: [
    block("seg", 7, 13, "aula"),
    block("ter", 9, 13, "aula"),
    block("qua", 7, 13, "aula"),
    block("qui", 9, 13, "aula"),
    block("qui", 19, 22, "pessoal"),
  ],
  "paula-monteiro": [
    block("seg", 9, 12, "aula"),
    block("seg", 13, 16, "aula"),
    block("ter", 13, 17, "aula"),
    block("qua", 8, 10, "aula"),
    block("qua", 11, 15, "aula"),
    block("qui", 14, 19, "aula"),
    block("sex", 9, 13, "aula"),
  ],
  renan: [
    block("seg", 8, 18, "aula"),
    block("ter", 7, 20, "aula"),
    block("qua", 7, 16, "aula"),
    block("qui", 7, 10, "aula"),
    block("qui", 11, 13, "aula"),
    block("qui", 14, 18, "aula"),
    block("sex", 18, 22, "pessoal"),
  ],
  roberth: [
    block("seg", 7, 9, "pessoal"),
    block("seg", 9, 12, "outro"),
    block("seg", 13, 17, "aula"),
    block("ter", 7, 10, "pessoal"),
    block("ter", 10, 13, "outro"),
    block("qua", 7, 9, "pessoal"),
    block("qua", 9, 12, "outro"),
    block("qua", 13, 18, "aula"),
    block("qui", 7, 10, "pessoal"),
    block("qui", 10, 13, "outro"),
    block("qui", 14, 16, "aula"),
    block("sex", 8, 10, "pessoal"),
    block("sex", 10, 13, "outro"),
    block("sex", 13, 22, "aula"),
  ],
  pimentel: [
    block("seg", 7, 11, "aula"),
    block("seg", 11, 14, "aula"),
    block("ter", 9, 11, "aula"),
    block("ter", 11, 16, "aula"),
    block("qua", 7, 10, "aula"),
    block("qua", 10, 14, "aula"),
    block("qui", 7, 9, "aula"),
    block("qui", 10, 16, "aula"),
    block("sex", 8, 17, "pessoal"),
    block("sex", 19, 22, "pessoal"),
  ],
};

/** Todo mundo ja confirmou a semana atual. */
export const initialConfirmed = agendaPeople.map((person) => person.id);

export const agendaDurations = [
  { id: "30min", label: "30min", hours: 0.5 },
  { id: "1h", label: "1h", hours: 1 },
  { id: "1h30", label: "1h30", hours: 1.5 },
  { id: "2h", label: "2h", hours: 2 },
];
