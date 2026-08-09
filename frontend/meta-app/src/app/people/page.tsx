import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PeopleContent } from "@/components/people/PeopleContent";

export const metadata: Metadata = {
  title: "Mapa & Pessoas | Meta App",
};

export default function PeoplePage() {
  return (
    <AppShell pageTitle="Mapa & Pessoas">
      <PageHeader
        eyebrow="ESTRUTURA & OPERAÇÃO"
        title="Mapa & Pessoas"
        description="A estrutura organizacional da Meta — células, coordenações e o diretório de pessoas."
      />
      <PeopleContent />
    </AppShell>
  );
}
