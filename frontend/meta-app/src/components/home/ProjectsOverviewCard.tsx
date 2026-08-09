import Link from "next/link";
import { Card, CardEyebrow } from "@/components/ui/Card";
import type { HomeData } from "@/types/home";

/**
 * Saíram daqui, por não terem origem no banco: "+3 este mês" (não há data de
 * criação em projeto_externo), "96% no prazo" (não há prazo previsto para
 * comparar com a entrega) e "Capacidade do time: 68%" (não existe registro de
 * capacidade ou alocação percentual em lugar nenhum).
 */
export function ProjectsOverviewCard({ overview }: { overview: HomeData["projects_overview"] }) {
  return (
    <Card>
      <CardEyebrow>PROJETOS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Visão geral</h3>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-3xl font-bold text-blue-600">{overview.active}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ativos</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{overview.completed}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Concluídos
          </p>
        </div>
      </div>

      <Link
        href="/external-projects"
        className="mt-5 inline-flex border-t border-slate-100 pt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Ver tudo →
      </Link>
    </Card>
  );
}
