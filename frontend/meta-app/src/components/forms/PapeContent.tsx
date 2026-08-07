"use client";

import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { PapeWizard } from "@/components/forms/PapeWizard";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import { normalizarStep, type TemplateComStepsApi } from "@/types/forms";

export function PapeContent() {
  // FormTaskCard manda ?template=<id>. Sem o parâmetro, cai no template 1,
  // que é o PAPE no seed — a rota /pape existia como atalho fixo para ele.
  const templateId = useSearchParams().get("template") ?? "1";

  const { data, erro, carregando } = useApi<TemplateComStepsApi>(
    `/forms/templates/${templateId}`,
  );

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar o formulário" />;

  if (carregando || !data) return <Skeleton className="h-[70vh]" />;

  const ordenados = [...data.steps].sort((a, b) => a.index - b.index);

  if (ordenados.length === 0) {
    return (
      <ErroCard
        titulo="Formulário sem etapas"
        erro="Este formulário ainda não tem etapas cadastradas. Rode scripts/seed_forms.py ou cadastre as etapas pelo painel."
      />
    );
  }

  return <PapeWizard steps={ordenados.map((s) => normalizarStep(s, ordenados.length))} />;
}
