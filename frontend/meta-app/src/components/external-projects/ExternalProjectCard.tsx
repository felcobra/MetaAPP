import type { ExternalProject } from "@/types/projects";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProjectStatusBadge, projectStatusBarColor } from "@/components/shared/ProjectStatusBadge";

export function ExternalProjectCard({ project }: { project: ExternalProject }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-950 text-sm font-bold text-white">
          {project.code}
        </span>
        <ProjectStatusBadge status={project.status} />
      </div>

      <h3 className="mt-4 text-xl font-bold text-slate-900">{project.client}</h3>
      <p className="text-sm text-slate-400">{project.area}</p>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span aria-hidden className="text-slate-300">
            ⌂
          </span>
          {project.manager}
        </span>
        <span className="font-semibold text-slate-800">{project.progress}%</span>
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
