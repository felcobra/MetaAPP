"use client";

/**
 * Chips de período da barra do topo.
 *
 * Só aparece nas telas que sabem recortar por data — ver `AppShell`. Um filtro
 * visível numa tela que o ignora é pior do que filtro nenhum: a pessoa marca
 * "26.1", nada muda, e ela passa a desconfiar do número em toda parte.
 *
 * Não existe chip "Tudo": clicar no chip aceso o apaga, e nada aceso já
 * significa todo o histórico. Como isso não é óbvio só de olhar, o chip ativo
 * ganha um × e um `title` dizendo o que o clique vai fazer.
 */

import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePeriod } from "@/lib/period-context";

export function PeriodFilter({ className }: { className?: string }) {
  const { periodo, alternarPeriodo, opcoes } = usePeriod();

  return (
    <div
      className={cn(
        "flex min-w-0 shrink items-center gap-1 rounded-xl border border-slate-200 bg-white p-1",
        className,
      )}
      role="group"
      aria-label="Recorte de período"
    >
      <CalendarDays className="ml-1.5 hidden h-4 w-4 shrink-0 text-slate-400 xl:block" />
      {/* Rola em vez de quebrar: em tela estreita a barra tem altura fixa, e
          um wrap aqui empurraria o resto do cabeçalho para fora. */}
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {opcoes.map((opcao) => {
          const ativo = opcao.key === periodo;

          return (
            <button
              key={opcao.key}
              type="button"
              onClick={() => alternarPeriodo(opcao.key)}
              aria-pressed={ativo}
              title={
                ativo
                  ? `${opcao.descricao} — clique para desmarcar e ver todo o histórico`
                  : opcao.descricao
              }
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
                ativo
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {opcao.label}
              {ativo ? <X className="h-3 w-3 shrink-0 opacity-70" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
