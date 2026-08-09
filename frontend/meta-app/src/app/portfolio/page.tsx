import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PortfolioContent } from "@/components/portfolio/PortfolioContent";

export const metadata: Metadata = {
  title: "Serviços & Portfólio | Meta App",
};

export default function PortfolioPage() {
  return (
    <AppShell pageTitle="Serviços & Portfólio">
      <PageHeader
        eyebrow="ESTRUTURA & OPERAÇÃO"
        title="Serviços & Portfólio"
        description="A carta de serviços da Meta organizada pelas coordenações técnicas - e a demanda comercial que chega a cada coordenação."
      />
      <PortfolioContent />
    </AppShell>
  );
}
