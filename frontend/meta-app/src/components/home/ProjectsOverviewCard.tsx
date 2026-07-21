import Link from "next/link";
import { projectsOverview } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function ProjectsOverviewCard() {
  return (
    <Card>
      <CardEyebrow>PROJETOS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Visão geral</h3>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-3xl font-bold text-blue-600">{projectsOverview.active}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ativos</p>
          <p className="mt-0.5 text-xs font-medium text-emerald-600">
            {projectsOverview.activeDelta}
          </p>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{projectsOverview.completed}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Concluídos
          </p>
          <p className="mt-0.5 text-xs font-medium text-emerald-600">
            {projectsOverview.completedOnTimeLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-500">{projectsOverview.teamCapacityLabel}</span>
        <span className="font-semibold text-slate-800">
          {projectsOverview.teamCapacityPercentage}%
        </span>
      </div>

      <Link
        href="/external-projects"
        className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Ver tudo →
      </Link>
    </Card>
  );
}
