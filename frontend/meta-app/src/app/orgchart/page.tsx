import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { OrgChartContent } from "@/components/orgchart/OrgChartContent";

export const metadata: Metadata = {
  title: "Organograma | Meta App",
};

export default function OrgChartPage() {
  return (
    <AppShell pageTitle="Organograma">
      <OrgChartContent />
    </AppShell>
  );
}
