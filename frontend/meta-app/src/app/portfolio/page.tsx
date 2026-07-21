import type { Metadata } from "next";
import { Filter, Layers3, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PortfolioCoordinationCard } from "@/components/portfolio/PortfolioCoordinationCard";
import { DemandTable } from "@/components/portfolio/DemandTable";
import { portfolioCoordinations } from "@/mocks/portfolio";

export const metadata: Metadata = {
  title: "Serviços & Portfólio | Meta App",
};

export default function PortfolioPage() {
  const totalServices = portfolioCoordinations.reduce(
    (sum, coordination) => sum + coordination.services.length,
    0,
  );
  const totalOpportunities = portfolioCoordinations.reduce(
    (sum, coordination) => sum + coordination.opportunities,
    0,
  );
  const mostDemanded = [...portfolioCoordinations].sort(
    (a, b) => b.opportunities - a.opportunities,
  )[0];

  return (
    <AppShell pageTitle="Serviços & Portfólio">
      <PageHeader
        eyebrow="ESTRUTURA & OPERAÇÃO"
        title="Serviços & Portfólio"
        description="A carta de serviços da Meta organizada pelas coordenações técnicas - e a demanda comercial que chega a cada coordenação."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Serviços no portfólio"
          value={totalServices}
          helper={`${portfolioCoordinations.length} coordenações`}
          icon={Layers3}
        />
        <StatCard
          label="Demanda comercial"
          value={totalOpportunities}
          helper="oportunidades por coordenação"
          icon={Target}
        />
        <StatCard
          label="Coordenação mais demandada"
          value={mostDemanded.name}
          helper={`${mostDemanded.opportunities} oportunidades`}
          icon={Filter}
        />
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
        Carta de serviços por coordenação
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {portfolioCoordinations.map((coordination) => (
          <PortfolioCoordinationCard key={coordination.code} coordination={coordination} />
        ))}
      </div>

      <DemandTable coordinations={portfolioCoordinations} />
    </AppShell>
  );
}
