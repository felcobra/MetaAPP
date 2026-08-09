import type {
  AgendaBlock,
  AgendaBlocksByPerson,
  AgendaDay,
  AgendaDayId,
  AgendaPerson,
  AgendaSuggestion,
} from "@/types/agenda";

/** A grade da semana vai das 07:00 as 22:00, em passos de 30 minutos. */
export const DAY_START = 7;
export const DAY_END = 22;
export const SLOT_HOURS = 0.5;
export const SLOTS_PER_DAY = (DAY_END - DAY_START) / SLOT_HOURS;

export const dayIds: AgendaDayId[] = ["seg", "ter", "qua", "qui", "sex"];

const dayLabels: Record<AgendaDayId, { label: string; shortLabel: string }> = {
  seg: { label: "Segunda", shortLabel: "Seg" },
  ter: { label: "Terça", shortLabel: "Ter" },
  qua: { label: "Quarta", shortLabel: "Qua" },
  qui: { label: "Quinta", shortLabel: "Qui" },
  sex: { label: "Sexta", shortLabel: "Sex" },
};

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export interface AgendaWeek {
  key: string;
  offset: number;
  /** "Esta semana", "Próxima semana", ... */
  label: string;
  /** "3 a 7 de agosto" */
  range: string;
  days: AgendaDay[];
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Segunda-feira da semana atual, deslocada por `offset` semanas. */
export function getWeek(offset: number, today = new Date()): AgendaWeek {
  const monday = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const weekday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - weekday + offset * 7);

  const days = dayIds.map((id, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return {
      id,
      label: dayLabels[id].label,
      shortLabel: dayLabels[id].shortLabel,
      date: `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}`,
    } satisfies AgendaDay;
  });

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  const sameMonth = monday.getUTCMonth() === friday.getUTCMonth();
  const range = sameMonth
    ? `${monday.getUTCDate()} a ${friday.getUTCDate()} de ${monthNames[monday.getUTCMonth()]}`
    : `${monday.getUTCDate()} de ${monthNames[monday.getUTCMonth()]} a ${friday.getUTCDate()} de ${monthNames[friday.getUTCMonth()]}`;

  const label =
    offset === 0
      ? "Esta semana"
      : offset === 1
        ? "Próxima semana"
        : offset === -1
          ? "Semana passada"
          : `Semana de ${monday.getUTCDate()}/${pad(monday.getUTCMonth() + 1)}`;

  return {
    key: `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`,
    offset,
    label,
    range,
    days,
  };
}

export function formatHour(value: number) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatDuration(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole && minutes) return `${whole}h${pad(minutes)}`;
  if (whole) return `${whole}h`;
  return `${minutes}min`;
}

/** Total de horas ocupadas na semana. */
export function totalBusyHours(blocks: AgendaBlock[] = []) {
  return blocks.reduce((total, block) => total + (block.end - block.start), 0);
}

export function formatBusyHours(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1).replace(".", ",")}h`;
}

/** Blocos de um dia, ordenados por horario de inicio. */
export function blocksOfDay(blocks: AgendaBlock[] = [], dayId: AgendaDayId) {
  return blocks.filter((block) => block.dayId === dayId).sort((a, b) => a.start - b.start);
}

function busyMask(blocks: AgendaBlock[], dayId: AgendaDayId) {
  const slots = new Array<boolean>(SLOTS_PER_DAY).fill(false);
  for (const block of blocks) {
    if (block.dayId !== dayId) continue;
    const from = Math.max(0, Math.round((block.start - DAY_START) / SLOT_HOURS));
    const to = Math.min(SLOTS_PER_DAY, Math.round((block.end - DAY_START) / SLOT_HOURS));
    for (let index = from; index < to; index += 1) slots[index] = true;
  }
  return slots;
}

interface SuggestionOptions {
  durationHours: number;
  requiredIds?: string[];
  limit?: number;
}

/**
 * Encontra as janelas maximas em que o maior numero de pessoas esta livre.
 * Uma janela e "maxima" quando esticar para a esquerda ou para a direita
 * reduziria o grupo de pessoas livres.
 */
export function buildSuggestions(
  people: AgendaPerson[],
  blocksByPerson: AgendaBlocksByPerson,
  days: AgendaDay[],
  { durationHours, requiredIds = [], limit = 6 }: SuggestionOptions,
): AgendaSuggestion[] {
  const fullMask = people.length >= 31 ? -1 >>> 0 : (1 << people.length) - 1;
  const requiredMask = people.reduce(
    (mask, person, index) => (requiredIds.includes(person.id) ? mask | (1 << index) : mask),
    0,
  );
  const minSlots = Math.max(1, Math.round(durationHours / SLOT_HOURS));
  const suggestions: AgendaSuggestion[] = [];

  days.forEach((day) => {
    const busyByPerson = people.map((person) => busyMask(blocksByPerson[person.id] ?? [], day.id));
    const freeMasks = Array.from({ length: SLOTS_PER_DAY }, (_, slot) =>
      people.reduce(
        (mask, _person, index) => (busyByPerson[index][slot] ? mask : mask | (1 << index)),
        0,
      ),
    );

    for (let from = 0; from < SLOTS_PER_DAY; from += 1) {
      let free = fullMask;
      for (let to = from; to < SLOTS_PER_DAY; to += 1) {
        free &= freeMasks[to];
        if (free === 0) break;

        const canGrowLeft = from > 0 && (free & freeMasks[from - 1]) === free;
        const canGrowRight = to < SLOTS_PER_DAY - 1 && (free & freeMasks[to + 1]) === free;
        if (canGrowLeft || canGrowRight) continue;
        if (to - from + 1 < minSlots) continue;
        if ((free & requiredMask) !== requiredMask) continue;

        const freeIds = people.filter((_, index) => free & (1 << index)).map((person) => person.id);
        const busyIds = people.filter((_, index) => !(free & (1 << index))).map((person) => person.id);

        suggestions.push({
          id: `${day.id}-${from}-${to}`,
          day,
          start: DAY_START + from * SLOT_HOURS,
          end: DAY_START + (to + 1) * SLOT_HOURS,
          freeIds,
          busyIds,
        });
      }
    }
  });

  const dayOrder = new Map(days.map((day, index) => [day.id, index]));

  return suggestions
    .sort((a, b) => {
      const byPeople = b.freeIds.length - a.freeIds.length;
      if (byPeople) return byPeople;
      const byLength = b.end - b.start - (a.end - a.start);
      if (byLength) return byLength;
      const byDay = (dayOrder.get(a.day.id) ?? 0) - (dayOrder.get(b.day.id) ?? 0);
      if (byDay) return byDay;
      return a.start - b.start;
    })
    .slice(0, limit);
}

/** Junta slots de 30 minutos consecutivos da mesma categoria em blocos. */
export function slotsToBlocks(
  slotsByDay: Record<AgendaDayId, (string | null)[]>,
): AgendaBlock[] {
  const blocks: AgendaBlock[] = [];

  dayIds.forEach((dayId) => {
    const slots = slotsByDay[dayId] ?? [];
    let index = 0;
    while (index < slots.length) {
      const category = slots[index];
      if (!category) {
        index += 1;
        continue;
      }
      let end = index;
      while (end + 1 < slots.length && slots[end + 1] === category) end += 1;
      blocks.push({
        dayId,
        start: DAY_START + index * SLOT_HOURS,
        end: DAY_START + (end + 1) * SLOT_HOURS,
        category: category as AgendaBlock["category"],
      });
      index = end + 1;
    }
  });

  return blocks;
}

/** Converte blocos em slots de 30 minutos, para edicao celula a celula. */
export function blocksToSlots(blocks: AgendaBlock[] = []) {
  const slotsByDay = Object.fromEntries(
    dayIds.map((dayId) => [dayId, new Array<string | null>(SLOTS_PER_DAY).fill(null)]),
  ) as Record<AgendaDayId, (string | null)[]>;

  for (const block of blocks) {
    const from = Math.max(0, Math.round((block.start - DAY_START) / SLOT_HOURS));
    const to = Math.min(SLOTS_PER_DAY, Math.round((block.end - DAY_START) / SLOT_HOURS));
    for (let index = from; index < to; index += 1) {
      slotsByDay[block.dayId][index] = block.category;
    }
  }

  return slotsByDay;
}
