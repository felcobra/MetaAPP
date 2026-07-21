import type { ProjectStatus } from "@/types/dashboard";
import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<ProjectStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  "no-prazo": { label: "No prazo", tone: "success" },
  atencao: { label: "Atenção", tone: "warning" },
  atrasado: { label: "Atrasado", tone: "danger" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

const progressBarColor: Record<ProjectStatus, string> = {
  "no-prazo": "bg-emerald-500",
  atencao: "bg-amber-400",
  atrasado: "bg-red-500",
};

export function projectStatusBarColor(status: ProjectStatus) {
  return progressBarColor[status];
}
