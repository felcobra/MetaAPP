"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CardEyebrow } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

/**
 * Formulário de login com autenticação real contra a API.
 * CRIT-01: substitui o handleSubmit que apenas redirecionava sem validar credenciais.
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      await login(email, password);
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao fazer login. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <CardEyebrow>BEM-VINDO DE VOLTA</CardEyebrow>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">
        Acesse sua conta Meta
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Use seu e-mail corporativo para continuar.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="seu.nome@metaconsultoria.com"
            icon={<Mail className="h-4 w-4" />}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mensagem de erro inline */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="md"
          className="h-12"
          disabled={isLoading}
        >
          {isLoading ? "Entrando…" : "Entrar na plataforma →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Primeiro acesso?{" "}
        <Link href="/cadastro" className="font-semibold text-blue-600 hover:text-blue-700">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
