import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  activeProjectRows,
  deliveriesByMonth,
  engagementByArea,
  kpiCards,
  proposalFunnel,
} from "@/mocks/dashboard";

export const metadata: Metadata = {
  title: "Dashboards | Meta App",
};

export default function DashboardsPage() {
  return (
    <AppShell pageTitle="Dashboards">
      <PageHeader
        eyebrow="DASHBOARDS"
        title="Visão geral da Meta"
        description="Indicadores combinados de projetos, pessoas e operação. Atualizado há 4 minutos."
        actions={
          <span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Junho · 2026
          </span>
        }
      />
      <DashboardTabs
        kpiCards={kpiCards}
        deliveries={deliveriesByMonth}
        engagement={engagementByArea}
        proposalFunnel={proposalFunnel}
        activeProjects={activeProjectRows}
      />
    </AppShell>
  );
}
