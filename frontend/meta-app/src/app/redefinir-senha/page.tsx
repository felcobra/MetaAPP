import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Redefinir senha | Meta App",
};

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <AuthShowcasePanel />
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-10">
        {/* ResetPasswordForm le ?token= via useSearchParams, que exige um
            limite de Suspense acima. */}
        <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-slate-100" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
