import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileDetailsCard } from "@/components/profile/ProfileDetailsCard";
import { currentUser } from "@/mocks/session";
import { profileDetails, profileStats } from "@/mocks/profile";

export const metadata: Metadata = {
  title: "Meu perfil | Meta App",
};

export default function ProfilePage() {
  return (
    <AppShell pageTitle="Meu perfil">
      <PageHeader
        eyebrow="PESSOAS"
        title="Meu perfil"
        description="Suas informações cadastrais e indicadores pessoais na Meta Consultoria."
      />

      <div className="flex flex-col gap-6">
        <ProfileHeaderCard user={currentUser} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {profileStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>

        <ProfileDetailsCard details={profileDetails} />
      </div>
    </AppShell>
  );
}
