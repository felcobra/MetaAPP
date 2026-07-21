import Link from "next/link";
import type { FormTask } from "@/types/forms";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function FormTaskCard({ task }: { task: FormTask }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <Badge tone="neutral">{task.frequency}</Badge>
        <span className="text-xs font-medium text-amber-600">⏱ {task.dueLabel}</span>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-slate-900">{task.title}</h3>
      <p className="mt-1 text-sm font-medium text-blue-600">{task.subtitle}</p>
      <p className="mt-3 text-sm text-slate-500">{task.description}</p>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etapas</p>
          <p className="font-semibold text-slate-800">{task.steps}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tempo</p>
          <p className="font-semibold text-slate-800">{task.duration}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Público</p>
          <p className="font-semibold text-slate-800">{task.audience}</p>
        </div>
      </div>

      {task.progress > 0 ? (
        <div className="mt-5">
          <ProgressBar value={task.progress} />
          <p className="mt-1.5 text-xs text-slate-400">{task.progress}% concluído</p>
        </div>
      ) : (
        <div className="mt-5 flex-1" />
      )}

      <Link
        href={task.id === "pape" ? "/pape" : "/forms"}
        className="brand-gradient mt-5 flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-white transition hover:brightness-105"
      >
        {task.ctaLabel} →
      </Link>
    </Card>
  );
}
