"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ExternalProject, ExternalProjectFilter } from "@/types/projects";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { ExternalProjectCard } from "./ExternalProjectCard";

const filterOptions: { id: ExternalProjectFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "no-prazo", label: "No prazo" },
  { id: "atencao", label: "Atenção" },
  { id: "atrasado", label: "Atrasado" },
];

export function ExternalProjectsBoard({ projects }: { projects: ExternalProject[] }) {
  const [filter, setFilter] = useState<ExternalProjectFilter>("todos");
  const [query, setQuery] = useState("");

  const noPrazoCount = projects.filter((project) => project.status === "no-prazo").length;
  const atencaoCount = projects.filter((project) => project.status === "atencao").length;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesFilter = filter === "todos" || project.status === filter;
      const matchesQuery = project.client.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, projects]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">PROJETOS</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">Projetos externos</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Acompanhe responsáveis, status e evolução dos projetos registrados na plataforma.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar projeto"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Projetos
          </span>
          <span className="text-2xl font-bold text-slate-900">{projects.length}</span>
        </Card>
        <Card className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            No prazo
          </span>
          <span className="text-2xl font-bold text-emerald-600">{noPrazoCount}</span>
        </Card>
        <Card className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Em atenção
          </span>
          <span className="text-2xl font-bold text-amber-500">{atencaoCount}</span>
        </Card>
      </div>

      <Tabs options={filterOptions} value={filter} onChange={(id) => setFilter(id as ExternalProjectFilter)} className="mb-6" />

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ExternalProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
          Nenhum projeto encontrado.
        </p>
      )}
    </div>
  );
}
