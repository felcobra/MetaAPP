import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ExternalProjectsContent } from "@/components/external-projects/ExternalProjectsContent";

export const metadata: Metadata = {
  title: "Projetos externos | Meta App",
};

export default function ExternalProjectsPage() {
  return (
    <AppShell pageTitle="Projetos externos">
      <ExternalProjectsContent />
    </AppShell>
  );
}
