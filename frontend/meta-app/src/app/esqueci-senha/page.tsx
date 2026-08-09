import type { Metadata } from "next";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Esqueci minha senha | Meta App",
};

export default function EsqueciSenhaPage() {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <AuthShowcasePanel />
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-10">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
