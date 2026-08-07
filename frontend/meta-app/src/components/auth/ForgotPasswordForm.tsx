"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CardEyebrow } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";

export function ForgotPasswordForm() {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const email = (
      event.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar o e-mail.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="w-full max-w-md">
        <CardEyebrow>VERIFIQUE SEU E-MAIL</CardEyebrow>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Link enviado</h2>
        {/* Texto deliberadamente condicional ("se existir uma conta"): a API
            responde igual para e-mail cadastrado ou não, e a tela nao pode
            entregar por texto o que o backend esconde de proposito. */}
        <p className="mt-3 text-sm text-slate-500">
          Se existir uma conta com esse e-mail, o link de redefinição chegou na caixa
          de entrada. Ele vale por 30 minutos e só pode ser usado uma vez.
        </p>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <CardEyebrow>RECUPERAR ACESSO</CardEyebrow>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">Esqueceu a senha?</h2>
      <p className="mt-2 text-sm text-slate-500">
        Informe seu e-mail corporativo e enviaremos um link para você definir uma nova.
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
          {enviando ? "Enviando…" : "Enviar link de redefinição →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lembrou?{" "}
        <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
