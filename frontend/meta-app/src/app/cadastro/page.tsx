import type { Metadata } from "next";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta | Meta App",
};

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <AuthShowcasePanel />
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-10">
        <RegisterForm />
      </div>
    </div>
  );
}
