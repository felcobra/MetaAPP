import type { Metadata } from "next";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileContent } from "@/components/profile/ProfileContent";

export const metadata: Metadata = {
  title: "Meu perfil | Meta App",
};

// A página segue server component só para exportar `metadata`; os dados do
// perfil dependem do token no browser, então vivem em ProfileContent.
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

      <ProfileContent />
    </AppShell>
  );
}
