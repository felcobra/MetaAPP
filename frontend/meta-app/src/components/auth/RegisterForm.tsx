"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CardEyebrow } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

/** Mesma regra do backend, validada antes de enviar para dar retorno imediato. */
function senhaInvalida(senha: string): string | null {
  if (senha.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(senha)) return "A senha deve conter ao menos uma letra.";
  if (!/\d/.test(senha)) return "A senha deve conter ao menos um número.";
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Sem isto, um Enter dado antes de o React hidratar faz o navegador
  // submeter o form nativamente. Como o metodo padrao do HTML e GET, e-mail
  // e SENHA iriam parar na query string -- e portanto no historico do
  // navegador, em logs de proxy e no cabecalho Referer. Em modo dev a janela
  // e de varios segundos, porque o Next compila a pagina sob demanda.
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const senha = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmacao = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    const problema = senhaInvalida(senha);
    if (problema) {
      setErro(problema);
      return;
    }

    setEnviando(true);
    try {
      await register(email, senha);
      router.push("/home");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <CardEyebrow>PRIMEIRO ACESSO</CardEyebrow>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">Crie sua conta Meta</h2>
      <p className="mt-2 text-sm text-slate-500">
        Use o mesmo e-mail corporativo que a Meta tem no seu cadastro de membro.
      </p>

      <form className="mt-8 space-y-5" method="post" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="seu.nome@metaconsultoria.com"
            icon={<Mail className="h-4 w-4" />}
            disabled={enviando}
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={mostrarSenha ? "text" : "password"}
              required
              placeholder="••••••••"
              disabled={enviando}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Mínimo de 8 caracteres, com ao menos uma letra e um número.
          </p>
        </div>

        <div>
          <Label htmlFor="confirm">Confirme a senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm"
              name="confirm"
              type={mostrarSenha ? "text" : "password"}
              required
              placeholder="••••••••"
              disabled={enviando}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span className="shrink-0">⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="md"
          className="h-12"
          disabled={enviando || !hidratado}
        >
          {enviando ? "Criando conta…" : "Criar conta →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
