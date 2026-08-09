"use client";

import { useApiVarios } from "@/lib/use-api";
import { ConnectedSystemFlow } from "@/components/home/ConnectedSystemFlow";
import { RevenueProgressCard } from "@/components/home/RevenueProgressCard";
import { SalesFunnelCard } from "@/components/home/SalesFunnelCard";
import { TvMetaBanner } from "@/components/home/TvMetaBanner";
import { ProjectsOverviewCard } from "@/components/home/ProjectsOverviewCard";
import { BirthdaysCard } from "@/components/home/BirthdaysCard";
import { RecognitionsCard } from "@/components/home/RecognitionsCard";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import type { DashboardGeral, HomeData } from "@/types/home";

export function HomeContent() {
  const { data, erro, carregando } = useApiVarios<[HomeData, DashboardGeral]>([
    "/dashboard/home",
    "/dashboard/",
  ]);

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar a Home" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const [home, geral] = data;

  return (
    <>
      <ConnectedSystemFlow dados={geral} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueProgressCard revenue={home.revenue} />
        </div>
        <SalesFunnelCard estagios={home.sales_funnel} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TvMetaBanner />
        </div>
        <div className="flex flex-col gap-6">
          <ProjectsOverviewCard overview={home.projects_overview} />
          <BirthdaysCard pessoas={home.birthdays} />
          <RecognitionsCard itens={home.recognitions} />
        </div>
      </div>
    </>
  );
}
