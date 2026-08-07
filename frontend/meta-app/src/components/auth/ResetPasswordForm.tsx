"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { CardEyebrow } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";

function senhaInvalida(senha: string): string | null {
  if (senha.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(senha)) return "A senha deve conter ao menos uma letra.";
  if (!/\d/.test(senha)) return "A senha deve conter ao menos um número.";
  return null;
}

function CampoSenha({ id, label }: { id: string; label: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          name={id}
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);

  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const f = event.currentTarget;
    const nova = (f.elements.namedItem("senha_nova") as HTMLInputElement).value;
    const confirma = (f.elements.namedItem("confirma") as HTMLInputElement).value;

    if (nova !== confirma) return setErro("As senhas não conferem.");
    const problema = senhaInvalida(nova);
    if (problema) return setErro(problema);

    setEnviando(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, senha_nova: nova }),
      });
      setPronto(true);
      // Sem login automático: quem chegou aqui prova ter acesso ao e-mail, o
      // que basta para redefinir, mas entrar direto tornaria o link uma
      // credencial completa se ele vazasse depois de usado.
      setTimeout(() => router.push("/"), 2500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível redefinir a senha.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <CardEyebrow>LINK INVÁLIDO</CardEyebrow>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Link incompleto</h2>
        <p className="mt-3 text-sm text-slate-500">
          Este endereço não traz um token de redefinição. Copie o link do e-mail inteiro,
          ou peça um novo.
        </p>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/esqueci-senha" className="font-semibold text-blue-600 hover:text-blue-700">
            Pedir novo link
          </Link>
        </p>
      </div>
    );
  }

  if (pronto) {
    return (
      <div className="w-full max-w-md">
        <CardEyebrow>TUDO CERTO</CardEyebrow>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Senha redefinida</h2>
        <p className="mt-3 text-sm text-slate-500">
          Já pode entrar com a senha nova. Redirecionando para o login…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <CardEyebrow>NOVA SENHA</CardEyebrow>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">Defina sua nova senha</h2>
      <p className="mt-2 text-sm text-slate-500">
        Escolha uma senha que você ainda não use em outro serviço.
      </p>

      <form className="mt-8 space-y-5" method="post" onSubmit={handleSubmit}>
        <CampoSenha id="senha_nova" label="Nova senha" />
        <CampoSenha id="confirma" label="Confirme a nova senha" />
        <p className="text-xs text-slate-400">
          Mínimo de 8 caracteres, com ao menos uma letra e um número.
        </p>

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
          {enviando ? "Salvando…" : "Redefinir senha →"}
        </Button>
      </form>
    </div>
  );
}
