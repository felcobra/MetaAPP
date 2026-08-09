"use client";

import { Filter, Layers3, Target } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { StatCard } from "@/components/ui/StatCard";
import { PortfolioCoordinationCard } from "@/components/portfolio/PortfolioCoordinationCard";
import { DemandTable } from "@/components/portfolio/DemandTable";
import { ErroCard, Skeleton, VazioCard } from "@/components/ui/AsyncState";
import { normalizarCoordenacao, type CoordenacaoApi } from "@/types/portfolio";

export function PortfolioContent() {
  const { data, erro, carregando } = useApi<CoordenacaoApi[]>("/portfolio/coordenacoes");

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar o portfólio" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const coordenacoes = data.map(normalizarCoordenacao);

  if (coordenacoes.length === 0) {
    return <VazioCard mensagem="Nenhuma coordenação cadastrada." />;
  }

  const totalServicos = coordenacoes.reduce((s, c) => s + c.services.length, 0);
  const totalOportunidades = coordenacoes.reduce((s, c) => s + c.opportunities, 0);
  const maisDemandada = [...coordenacoes].sort((a, b) => b.opportunities - a.opportunities)[0];

  return (
    <>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <StatCard
          label="Serviços no portfólio"
          value={totalServicos}
          helper={`${coordenacoes.length} ${coordenacoes.length === 1 ? "coordenação" : "coordenações"}`}
          icon={Layers3}
        />
        <StatCard
          label="Demanda comercial"
          value={totalOportunidades}
          helper="oportunidades por coordenação"
          icon={Target}
        />
        <StatCard
          label="Coordenação mais demandada"
          value={maisDemandada.name}
          helper={`${maisDemandada.opportunities} oportunidades`}
          icon={Filter}
        />
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
        Carta de serviços por coordenação
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {coordenacoes.map((c) => (
          <PortfolioCoordinationCard key={c.code} coordination={c} />
        ))}
      </div>

      <DemandTable coordinations={coordenacoes} />
    </>
  );
}
