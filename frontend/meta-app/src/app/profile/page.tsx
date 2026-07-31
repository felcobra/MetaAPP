import type { Metadata } from "next";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileDetailsCard } from "@/components/profile/ProfileDetailsCard";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { profileUser, profileStats, profileFields, securityItems } from "@/mocks/profile";

export const metadata: Metadata = {
  title: "Meu perfil | Meta App",
};

export default function ProfilePage() {
  return (
    <AppShell pageTitle="Meu perfil">
      <PageHeader
        eyebrow="PERFIL"
        title="Sua conta Meta"
        description="Atualize seus dados, gerencie preferências e veja sua atividade."
        actions={
          <>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar perfil
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 transition-colors hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir conta
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileHeaderCard user={profileUser} stats={profileStats} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ProfileDetailsCard fields={profileFields} />
          <SecurityCard items={securityItems} />
        </div>
      </div>
    </AppShell>
  );
}
