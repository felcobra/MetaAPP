import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MembersTable } from "@/components/members/MembersTable";

export const metadata: Metadata = {
  title: "Membros | Meta App",
};

export default function MembersPage() {
  return (
    <AppShell pageTitle="Gestão de Membros">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Membros</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie os membros da empresa, seus status e realize novos cadastros.
          </p>
        </div>
        <MembersTable />
      </div>
    </AppShell>
  );
}
