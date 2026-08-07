import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeContent } from "@/components/home/HomeContent";

export const metadata: Metadata = {
  title: "Início | Meta App",
};

export default function HomePage() {
  return (
    <AppShell pageTitle="Início">
      <HomeHeader />
      <HomeContent />
    </AppShell>
  );
}
