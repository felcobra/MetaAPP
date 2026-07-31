import type { ExternalProject } from "@/types/projects";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProjectStatusBadge, projectStatusBarColor } from "@/components/shared/ProjectStatusBadge";

export function ExternalProjectCard({ project }: { project: ExternalProject }) {
  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-sm font-bold text-white">
          {project.code}
        </span>
        <ProjectStatusBadge status={project.status} />
      </div>

      <h3 className="mt-4 line-clamp-2 min-w-0 text-xl font-bold leading-tight text-slate-900">{project.client}</h3>
      <p className="mt-1 truncate text-sm text-slate-400">{project.area}</p>

      <div className="mt-5 flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <span aria-hidden className="shrink-0 text-slate-300">a</span>
          <span className="truncate">{project.manager}</span>
        </span>
        <span className="shrink-0 font-semibold text-slate-800">{project.progress}%</span>
      </div>
      <div className="mt-2">
        <ProgressBar
          value={project.progress}
          gradient={false}
          barClassName={projectStatusBarColor(project.status)}
        />
      </div>
    </Card>
  );
}
