import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardsContent } from "@/components/dashboard/DashboardsContent";

export const metadata: Metadata = {
  title: "Dashboards | Meta App",
};

export default function DashboardsPage() {
  return (
    <AppShell pageTitle="Dashboards">
      {/* A descrição dizia "Atualizado há 4 minutos" e o filtro mostrava
          "Junho · 2026", ambos fixos no código. Não há cache com timestamp
          nem seletor de período implementado, então os dois saíram. */}
      <PageHeader
        eyebrow="DASHBOARDS"
        title="Visão geral da Meta"
        description="Indicadores combinados de projetos, pessoas e operação."
      />
      <DashboardsContent />
    </AppShell>
  );
}
