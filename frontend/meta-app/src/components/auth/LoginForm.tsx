"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CardEyebrow } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState("entrar");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/home");
  }

  return (
    <div className="w-full max-w-md">
      <Tabs
        options={[
          { id: "entrar", label: "Entrar" },
          { id: "criar-conta", label: "Criar conta" },
        ]}
        value={mode}
        onChange={setMode}
        className="mb-8 bg-slate-200/70"
      />

      {mode === "entrar" ? (
        <>
          <CardEyebrow>BEM-VINDO DE VOLTA</CardEyebrow>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Acesse sua conta Meta</h2>
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                />
                Lembrar de mim
              </label>
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                Esqueci minha senha
              </a>
            </div>

            <Button type="submit" fullWidth size="md" className="h-12">
              Entrar na plataforma →
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">OU</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ChevronDown className="h-4 w-4" />
            Continuar com SSO Meta
          </button>
        </>
      ) : (
        <>
          <CardEyebrow>COMECE AGORA</CardEyebrow>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Crie sua conta Meta</h2>
          <p className="mt-2 text-sm text-slate-500">
            Peça o convite corporativo para o seu gestor direto.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="signup-name">Nome completo</Label>
              <Input id="signup-name" name="name" required placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="signup-email">E-mail corporativo</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                required
                placeholder="seu.nome@metaconsultoria.com"
                icon={<Mail className="h-4 w-4" />}
              />
            </div>
            <Button type="submit" fullWidth size="md" className="h-12">
              Criar conta →
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
