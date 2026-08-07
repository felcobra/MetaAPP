import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { FormsContent } from "@/components/forms/FormsContent";

export const metadata: Metadata = {
  title: "Formulários | Meta App",
};

export default function FormsPage() {
  return (
    <AppShell pageTitle="Formulários">
      <FormsContent />
    </AppShell>
  );
}
