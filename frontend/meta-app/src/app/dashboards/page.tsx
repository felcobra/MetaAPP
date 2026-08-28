import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardsContent } from "@/components/dashboard/DashboardsContent";

export const metadata: Metadata = {
  title: "Dashboards | Meta App",
};

export default function DashboardsPage() {
  return (
    <AppShell pageTitle="Dashboards" showPeriodFilter>
      {/* A descrição dizia "Atualizado há 4 minutos" e o filtro mostrava
          "Junho · 2026", ambos fixos no código, e por isso saíram. O timestamp
          continua sem existir (não há cache com data); o seletor de período
          voltou de verdade, na barra do topo — ver `PeriodFilter`. */}
      <PageHeader
        eyebrow="DASHBOARDS"
        title="Visão geral da Meta"
        description="Indicadores combinados de projetos, pessoas e operação."
      />
      <DashboardsContent />
    </AppShell>
  );
}
