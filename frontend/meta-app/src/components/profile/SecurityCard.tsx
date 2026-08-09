"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

/** Mesma regra do backend, para dar retorno antes de ir na rede. */
function senhaInvalida(senha: string): string | null {
  if (senha.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(senha)) return "A senha deve conter ao menos uma letra.";
  if (!/\d/.test(senha)) return "A senha deve conter ao menos um número.";
  return null;
}

function CampoSenha({ id, label }: { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        required
        autoComplete={id === "senha_atual" ? "current-password" : "new-password"}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function FormularioSenha({ onPronto }: { onPronto: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const f = event.currentTarget;
    const atual = (f.elements.namedItem("senha_atual") as HTMLInputElement).value;
    const nova = (f.elements.namedItem("senha_nova") as HTMLInputElement).value;
    const confirma = (f.elements.namedItem("confirma") as HTMLInputElement).value;

    if (nova !== confirma) return setErro("As senhas não conferem.");
    const problema = senhaInvalida(nova);
    if (problema) return setErro(problema);

    setEnviando(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ senha_atual: atual, senha_nova: nova }),
      });
      onPronto();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível trocar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    // method="post": se o Enter vier antes da hidratação, o submit nativo nao
    // joga as senhas na query string. Mesmo cuidado dos formularios de login.
    <form method="post" onSubmit={handleSubmit} className="mt-3 space-y-3">
      <CampoSenha id="senha_atual" label="Senha atual" />
      <CampoSenha id="senha_nova" label="Nova senha" />
      <CampoSenha id="confirma" label="Confirme a nova senha" />
      <p className="text-xs text-slate-400">
        Mínimo de 8 caracteres, com ao menos uma letra e um número.
      </p>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {erro}
        </p>
      )}

      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}

export function SecurityCard() {
  const [aberto, setAberto] = useState(false);
  const [trocada, setTrocada] = useState(false);

  return (
    <Card>
      <h3 className="text-base font-bold text-slate-900">Segurança</h3>

      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Senha</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {trocada ? "Senha alterada com sucesso." : "Defina uma nova senha de acesso"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAberto((v) => !v);
                setTrocada(false);
              }}
              className="shrink-0 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              {aberto ? "Cancelar" : "Alterar"}
            </button>
          </div>

          {aberto && (
            <FormularioSenha
              onPronto={() => {
                setAberto(false);
                setTrocada(true);
              }}
            />
          )}
        </div>

        {/* 2FA e sessoes continuam sem backend: nao ha segundo fator
            implementado, e revoked_tokens guarda apenas os JTIs deslogados,
            o que nao permite listar sessoes ativas. */}
        {[
          { label: "Autenticação em 2 fatores", desc: "Ainda não disponível", cta: "Ativar" },
          { label: "Sessões ativas", desc: "Ainda não disponível", cta: "Ver" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
            </div>
            <button
              type="button"
              disabled
              className="shrink-0 cursor-not-allowed text-xs font-semibold text-slate-300"
            >
              {item.cta}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
