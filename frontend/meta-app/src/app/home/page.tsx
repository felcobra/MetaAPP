import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ConnectedSystemFlow } from "@/components/home/ConnectedSystemFlow";
import { RevenueProgressCard } from "@/components/home/RevenueProgressCard";
import { SalesFunnelCard } from "@/components/home/SalesFunnelCard";
import { TvMetaBanner } from "@/components/home/TvMetaBanner";
import { ProjectsOverviewCard } from "@/components/home/ProjectsOverviewCard";
import { BirthdaysCard } from "@/components/home/BirthdaysCard";
import { RecognitionsCard } from "@/components/home/RecognitionsCard";
import { currentUser } from "@/mocks/session";

export const metadata: Metadata = {
  title: "Início | Meta App",
};

export default function HomePage() {
  return (
    <AppShell pageTitle="Início">
      <HomeHeader userName={currentUser.name} />
      <ConnectedSystemFlow />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueProgressCard />
        </div>
        <SalesFunnelCard />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TvMetaBanner />
        </div>
        <div className="flex flex-col gap-6">
          <ProjectsOverviewCard />
          <BirthdaysCard />
          <RecognitionsCard />
        </div>
      </div>
    </AppShell>
  );
}
