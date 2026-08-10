import type { ProjectStatus } from "@/types/dashboard";
import type { ProjectLifecycleStatus } from "@/types/projects";
import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<
  ProjectStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  "no-prazo": { label: "No prazo", tone: "success" },
  atencao: { label: "Atenção", tone: "warning" },
  atrasado: { label: "Atrasado", tone: "danger" },
  concluido: { label: "Concluído", tone: "success" },
  // Projeto sem PAPE respondido: não dá para afirmar nada sobre o prazo.
  "sem-dados": { label: "Sem PAPE", tone: "neutral" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

const progressBarColor: Record<ProjectStatus, string> = {
  "no-prazo": "bg-emerald-500",
  atencao: "bg-amber-400",
  atrasado: "bg-red-500",
  concluido: "bg-blue-500",
  "sem-dados": "bg-slate-300",
};

export function projectStatusBarColor(status: ProjectStatus) {
  return progressBarColor[status];
}

// ── Ciclo de vida do projeto (ativo/pausado/finalizado) ─────────────────────
// Dimensão diferente do PAPE acima: usada em Projetos Externos, onde a BDU
// classifica pelo status real do projeto, não pela saúde do cronograma.

const lifecycleConfig: Record<
  ProjectLifecycleStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }
> = {
  ativo: { label: "Em execução", tone: "info" },
  pausado: { label: "Pausado", tone: "warning" },
  finalizado: { label: "Concluído", tone: "success" },
};

export function ProjectLifecycleBadge({ status }: { status: ProjectLifecycleStatus }) {
  const config = lifecycleConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

const lifecycleBarColor: Record<ProjectLifecycleStatus, string> = {
  ativo: "bg-blue-500",
  pausado: "bg-amber-400",
  finalizado: "bg-emerald-500",
};

export function projectLifecycleBarColor(status: ProjectLifecycleStatus) {
  return lifecycleBarColor[status];
}
