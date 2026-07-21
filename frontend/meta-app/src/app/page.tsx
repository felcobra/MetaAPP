import type { Metadata } from "next";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar | Meta App",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-1">
      <AuthShowcasePanel />
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-10">
        <LoginForm />
      </div>
    </div>
  );
}
