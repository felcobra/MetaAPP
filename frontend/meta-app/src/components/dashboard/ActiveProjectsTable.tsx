import type { ActiveProjectRow } from "@/types/dashboard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProjectStatusBadge, projectStatusBarColor } from "@/components/shared/ProjectStatusBadge";

export function ActiveProjectsTable({ rows }: { rows: ActiveProjectRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="py-3 pr-4 font-semibold">Projeto</th>
            <th className="py-3 pr-4 font-semibold">Gerente</th>
            <th className="py-3 pr-4 font-semibold">Status</th>
            <th className="py-3 font-semibold">Progresso</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.project} className="border-b border-slate-100 last:border-0">
              <td className="py-4 pr-4 font-semibold text-slate-800">{row.project}</td>
              <td className="py-4 pr-4 text-slate-600">{row.manager}</td>
              <td className="py-4 pr-4">
                <ProjectStatusBadge status={row.status} />
              </td>
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={row.progress}
                    gradient={false}
                    barClassName={projectStatusBarColor(row.status)}
                    className="max-w-[160px]"
                  />
                  <span className="w-10 shrink-0 text-right font-semibold text-slate-700">
                    {row.progress}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
