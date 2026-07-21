import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { FormsBoard } from "@/components/forms/FormsBoard";
import { FormHistoryList } from "@/components/forms/FormHistoryList";
import { formHistory, formTasks } from "@/mocks/forms";

export const metadata: Metadata = {
  title: "Formulários | Meta App",
};

export default function FormsPage() {
  return (
    <AppShell pageTitle="Formulários">
      <FormsBoard tasks={formTasks} />
      <FormHistoryList items={formHistory} />
    </AppShell>
  );
}
