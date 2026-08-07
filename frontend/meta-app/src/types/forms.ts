export type FormFrequency = "QUINZENAL" | "MENSAL" | "SEMANAL";

export type FormStatus = "pendente" | "em-andamento" | "concluido";

export interface FormTask {
  id: string;
  templateId: number;
  frequency: FormFrequency;
  title: string;
  subtitle: string;
  description: string;
  steps: number;
  duration: string;
  audience: string;
  progress: number;
  status: FormStatus;
  ctaLabel: string;
}

export interface FormHistoryItem {
  id: string;
  title: string;
  client: string;
  date: string;
}

export type PapeFieldType = "date" | "text" | "textarea" | "radio";

export interface PapeField {
  id: number;
  type: PapeFieldType;
  label: string;
  required?: boolean;
  helper?: string;
  placeholder?: string;
  maxLength?: number;
  options?: string[];
}

export interface PapeStep {
  index: number;
  total: number;
  sectionLabel: string;
  title: string;
  description: string;
  fields: PapeField[];
}

// ── Respostas cruas da API ───────────────────────────────────────────────────

/** GET /forms/minhas-tarefas */
export interface TarefaApi {
  id: number;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  frequencia: FormFrequency;
  duracao_estimada: string | null;
  publico_alvo: string | null;
  total_steps: number;
  status: FormStatus;
  progresso: number;
  submissao_id: number | null;
}

/** GET /forms/historico */
export interface HistoricoApi {
  id: number;
  titulo: string;
  ciclo: string;
  projeto: string | null;
  data_submissao: string | null;
}

/** GET /forms/templates/{id} */
export interface TemplateComStepsApi {
  id: number;
  titulo: string;
  steps: {
    id: number;
    index: number;
    section_label: string | null;
    titulo: string;
    descricao: string | null;
    fields: {
      id: number;
      tipo: PapeFieldType;
      label: string;
      required: boolean;
      helper: string | null;
      placeholder: string | null;
      max_length: number | null;
      options: string[] | null;
      ordem: number;
    }[];
  }[];
}

const CTA: Record<FormStatus, string> = {
  pendente: "Começar agora",
  "em-andamento": "Continuar",
  concluido: "Revisar",
};

export function normalizarTarefa(t: TarefaApi): FormTask {
  return {
    id: String(t.id),
    templateId: t.id,
    frequency: t.frequencia,
    title: t.titulo,
    subtitle: t.subtitulo ?? "",
    description: t.descricao ?? "",
    steps: t.total_steps,
    duration: t.duracao_estimada ?? "—",
    audience: t.publico_alvo ?? "Todos",
    progress: t.progresso,
    status: t.status,
    ctaLabel: CTA[t.status],
  };
}

export function normalizarStep(
  s: TemplateComStepsApi["steps"][number],
  total: number,
): PapeStep {
  return {
    index: s.index,
    total,
    sectionLabel: s.section_label ?? "",
    title: s.titulo,
    description: s.descricao ?? "",
    fields: [...s.fields]
      .sort((a, b) => a.ordem - b.ordem)
      .map((f) => ({
        id: f.id,
        type: f.tipo,
        label: f.label,
        required: f.required,
        helper: f.helper ?? undefined,
        placeholder: f.placeholder ?? undefined,
        maxLength: f.max_length ?? undefined,
        options: f.options ?? undefined,
      })),
  };
}
