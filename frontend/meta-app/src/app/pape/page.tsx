import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PapeWizard } from "@/components/forms/PapeWizard";
import { papeSteps } from "@/mocks/forms";

export const metadata: Metadata = {
  title: "PAPE | Meta App",
};

export default function PapePage() {
  return (
    <AppShell pageTitle="PAPE">
      <div className="-m-4 sm:-m-6 lg:-m-10 lg:-mt-8">
        <PapeWizard steps={papeSteps} />
      </div>
    </AppShell>
  );
}
