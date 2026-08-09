import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PapeContent } from "@/components/forms/PapeContent";
import { Skeleton } from "@/components/ui/AsyncState";

export const metadata: Metadata = {
  title: "PAPE | Meta App",
};

export default function PapePage() {
  return (
    <AppShell pageTitle="PAPE">
      <div className="-m-4 sm:-m-6 lg:-m-10 lg:-mt-8">
        {/* PapeContent le ?template= via useSearchParams, que exige um limite
            de Suspense acima para nao forcar a rota inteira a ser dinamica. */}
        <Suspense fallback={<Skeleton className="h-[70vh]" />}>
          <PapeContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
