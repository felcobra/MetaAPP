"use client";

import { useApi } from "@/lib/use-api";
import { OrgChartExplorer } from "@/components/orgchart/OrgChartExplorer";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import { normalizarDivisoes, type OrgDivisaoApi } from "@/types/orgchart";

export function OrgChartContent() {
  const { data, erro, carregando } = useApi<OrgDivisaoApi[]>("/hr/orgchart");

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar o organograma" />;

  if (carregando || !data) return <Skeleton className="h-[70vh]" />;

  const divisoes = normalizarDivisoes(data);

  if (divisoes.length === 0) {
    return (
      <ErroCard
        titulo="Organograma vazio"
        erro="Nenhuma divisão com estrutura montada. As tabelas org_divisao e org_no são exclusivas do MetaApp e começam vazias — a hierarquia precisa ser cadastrada."
      />
    );
  }

  return <OrgChartExplorer divisions={divisoes} />;
}
