"use client";

import { useState } from "react";
import type {
  ActiveProjectRow,
  DashboardTabId,
  DeliveriesPoint,
  EngagementItem,
  KpiCard,
  ProposalFunnelStage,
} from "@/types/dashboard";
import { dashboardTabs } from "@/mocks/dashboard";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { KpiCardRow } from "./KpiCardRow";
import { DeliveriesLineChart } from "./DeliveriesLineChart";
import { EngagementList } from "./EngagementList";
import { ProposalFunnelBars } from "./ProposalFunnelBars";
import { ActiveProjectsTable } from "./ActiveProjectsTable";

interface DashboardTabsProps {
  kpiCards: KpiCard[];
  deliveries: DeliveriesPoint[];
  engagement: EngagementItem[];
  proposalFunnel: ProposalFunnelStage[];
  activeProjects: ActiveProjectRow[];
}

export function DashboardTabs({
  kpiCards,
  deliveries,
  engagement,
  proposalFunnel,
  activeProjects,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<DashboardTabId>("geral");

  return (
    <div>
      <Tabs
        options={dashboardTabs}
        value={tab}
        onChange={(id) => setTab(id as DashboardTabId)}
        className="mb-6"
      />

      <div className="mb-6">
        <KpiCardRow cards={kpiCards} />
      </div>

      {tab === "geral" && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardEyebrow>PROJETOS</CardEyebrow>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Entregas por mês</h3>
            <div className="mt-6">
              <DeliveriesLineChart data={deliveries} />
            </div>
          </Card>
          <Card>
            <CardEyebrow>PESSOAS</CardEyebrow>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Engajamento por área</h3>
            <div className="mt-6">
              <EngagementList items={engagement} />
            </div>
          </Card>
        </div>
      )}

      {tab === "projetos" && (
        <Card className="mb-6">
          <CardEyebrow>PROJETOS</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Entregas por mês</h3>
          <div className="mt-6">
            <DeliveriesLineChart data={deliveries} />
          </div>
        </Card>
      )}

      {tab === "pessoas" && (
        <Card className="mb-6">
          <CardEyebrow>PESSOAS</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Engajamento por área</h3>
          <div className="mt-6 max-w-xl">
            <EngagementList items={engagement} />
          </div>
        </Card>
      )}

      {(tab === "geral" || tab === "comercial") && (
        <Card className="mb-6">
          <CardEyebrow>COMERCIAL</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Funil de propostas</h3>
          <div className="mt-6">
            <ProposalFunnelBars stages={proposalFunnel} />
          </div>
        </Card>
      )}

      {(tab === "geral" || tab === "projetos") && (
        <Card>
          <CardEyebrow>OPERAÇÃO</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Status dos projetos ativos</h3>
          <div className="mt-6">
            <ActiveProjectsTable rows={activeProjects} />
          </div>
        </Card>
      )}
    </div>
  );
}
