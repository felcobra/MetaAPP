import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ExternalProjectsBoard } from "@/components/external-projects/ExternalProjectsBoard";
import { externalProjects } from "@/mocks/projects";

export const metadata: Metadata = {
  title: "Projetos externos | Meta App",
};

export default function ExternalProjectsPage() {
  return (
    <AppShell pageTitle="Projetos externos">
      <ExternalProjectsBoard projects={externalProjects} />
    </AppShell>
  );
}
