import type { ProjectStatus } from "@/types/dashboard";
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
