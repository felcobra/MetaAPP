import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinancialContent } from "@/components/financial/FinancialContent";

export const metadata: Metadata = {
  title: "Contratos & Financeiro | Meta App",
};

export default function FinancialPage() {
  return (
    <AppShell pageTitle="Contratos & Financeiro" showPeriodFilter>
      <PageHeader
        eyebrow="COMERCIAL & FINANCEIRO"
        title="Contratos, Receita & Financeiro"
        description="Contratos, clientes e projetos de um lado; pagamentos, parcelas e transações do outro."
      />
      <FinancialContent />
    </AppShell>
  );
}
