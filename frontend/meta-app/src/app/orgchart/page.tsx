import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { OrgChartExplorer } from "@/components/orgchart/OrgChartExplorer";
import { orgDivisions } from "@/mocks/orgchart";

export const metadata: Metadata = {
  title: "Organograma | Meta App",
};

export default function OrgChartPage() {
  return (
    <AppShell pageTitle="Organograma">
      <OrgChartExplorer divisions={orgDivisions} />
    </AppShell>
  );
}
