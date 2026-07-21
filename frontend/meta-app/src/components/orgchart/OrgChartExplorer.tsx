"use client";

import { useState } from "react";
import type { OrgDivision } from "@/types/orgchart";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrgDivisionSelect } from "./OrgDivisionSelect";
import { OrgChartCanvas } from "./OrgChartCanvas";

export function OrgChartExplorer({ divisions }: { divisions: OrgDivision[] }) {
  const [divisionId, setDivisionId] = useState(divisions[0]?.id);
  const division = divisions.find((entry) => entry.id === divisionId) ?? divisions[0];

  return (
    <div>
      <PageHeader
        eyebrow="PESSOAS"
        title="Organograma"
        description="Conheça a estrutura, as áreas e as lideranças da Meta Consultoria."
        actions={
          <OrgDivisionSelect divisions={divisions} value={division.id} onChange={setDivisionId} />
        }
      />
      <OrgChartCanvas key={division.id} root={division.root} />
    </div>
  );
}
