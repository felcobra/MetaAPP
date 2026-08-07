import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { CommercialContent } from "@/components/commercial/CommercialContent";

export const metadata: Metadata = {
  title: "Comercial | Meta App",
};

export default function CommercialPage() {
  return (
    <AppShell pageTitle="Comercial">
      {/* @container: a barra lateral muda a largura DESTE bloco, nao a da janela.
          Todo o escalonamento da pagina responde a esta largura, de modo que a
          distribuicao em duas colunas se mantem com o menu aberto. */}
      <div className="@container mx-auto min-w-0 max-w-[1500px]">
        <PageHeader
          eyebrow="COMERCIAL & FINANCEIRO"
          title="Comercial, Oportunidades & Clientes"
          description="O fluxo comercial da Meta de ponta a ponta."
        />
        <CommercialContent />
      </div>
    </AppShell>
  );
}
