import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ExternalProjectsContent } from "@/components/external-projects/ExternalProjectsContent";

export const metadata: Metadata = {
  title: "Projetos externos | Meta App",
};

// Sem `showPeriodFilter`: `projeto_externo.data_inicio` está preenchida em 3
// das 22 linhas, então qualquer recorte esvaziaria o quadro em vez de filtrá-lo.
// Ver a docstring de `/projetos/board` no backend.
export default function ExternalProjectsPage() {
  return (
    <AppShell pageTitle="Projetos externos">
      <ExternalProjectsContent />
    </AppShell>
  );
}
