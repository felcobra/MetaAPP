import Link from "next/link";
import type { FormTask } from "@/types/forms";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function FormTaskCard({ task }: { task: FormTask }) {
  return (
    <Card className="flex h-full min-w-0 flex-col">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Badge tone="neutral">{task.frequency}</Badge>
        <span className="shrink-0 text-xs font-medium text-amber-600">Prazo: {task.dueLabel}</span>
      </div>

      <h3 className="mt-4 line-clamp-2 min-w-0 text-2xl font-bold leading-tight text-slate-900">{task.title}</h3>
      <p className="mt-1 min-w-0 break-words text-sm font-medium text-blue-600">{task.subtitle}</p>
      <p className="mt-3 line-clamp-3 min-w-0 text-sm leading-6 text-slate-500">{task.description}</p>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etapas</p>
          <p className="truncate font-semibold text-slate-800">{task.steps}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tempo</p>
          <p className="truncate font-semibold text-slate-800">{task.duration}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Publico</p>
          <p className="truncate font-semibold text-slate-800">{task.audience}</p>
        </div>
      </div>

      {task.progress > 0 ? (
        <div className="mt-5">
          <ProgressBar value={task.progress} />
          <p className="mt-1.5 text-xs text-slate-400">{task.progress}% concluido</p>
        </div>
      ) : (
        <div className="mt-5 flex-1" />
      )}

      <Link
        href={task.id === "pape" ? "/pape" : "/forms"}
        className="brand-gradient mt-5 flex min-h-12 items-center justify-center rounded-xl px-4 text-center text-sm font-semibold text-white transition hover:brightness-105"
      >
        <span className="truncate">{task.ctaLabel} {"->"}</span>
      </Link>
    </Card>
  );
}
