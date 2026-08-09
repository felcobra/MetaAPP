"use client";

import { useApi } from "@/lib/use-api";
import { ExternalProjectsBoard } from "@/components/external-projects/ExternalProjectsBoard";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import { normalizarProjeto, type ProjetoBoardApi } from "@/types/projects";

export function ExternalProjectsContent() {
  const { data, erro, carregando } = useApi<ProjetoBoardApi[]>("/projetos/board");

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar os projetos" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return <ExternalProjectsBoard projects={data.map(normalizarProjeto)} />;
}
