"use client";

import { useState } from "react";
import type { OrgDivision } from "@/types/orgchart";
import { chaveDeArmazenamento } from "@/lib/orgchart-storage";
import { PageHeader } from "@/components/shared/PageHeader";
import { AreaSelector } from "./AreaSelector";
import { OrgChart } from "./OrgChart";

interface OrgChartExplorerProps {
  divisions: OrgDivision[];
  /** Libera a barra "Editar organograma" dentro do gráfico. */
  podeEditar?: boolean;
}

export function OrgChartExplorer({ divisions, podeEditar = false }: OrgChartExplorerProps) {
  const [divisionId, setDivisionId] = useState(divisions[0]?.id);
  const division = divisions.find((entry) => entry.id === divisionId) ?? divisions[0];

  return (
    <div>
      <PageHeader
        eyebrow="PESSOAS"
        title="Organograma"
        description="Conheça a estrutura, as áreas e as lideranças da Meta Consultoria."
        actions={
          <AreaSelector divisions={divisions} value={division.id} onChange={setDivisionId} />
        }
      />
      {/* key por divisão: cada área tem a sua própria edição em andamento. */}
      <OrgChart
        key={division.id}
        root={division.root}
        podeEditar={podeEditar}
        chaveDeArmazenamento={chaveDeArmazenamento(division.id)}
      />
    </div>
  );
}
