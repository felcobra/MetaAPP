"use client";

/**
 * Selo "Lendo: <período>" no topo das telas que recortam por data.
 *
 * Os chips ficam na barra do topo, longe dos números. Sem este selo, quem
 * chega numa tela já filtrada (o período sobrevive à navegação) não tem como
 * saber que está olhando um recorte, e lê 10 ganhos como se fossem o total.
 *
 * `aviso` é para o que não obedeceu ao filtro naquela tela — sempre por falta
 * de coluna de data, nunca por opção de esconder.
 */

import { Circle } from "lucide-react";

interface PeriodoLidoProps {
  descricao: string;
  ativo: boolean;
  aviso?: string;
}

export function PeriodoLido({ descricao, ativo, aviso }: PeriodoLidoProps) {
  return (
    // Breakpoints normais, não container-queries: das quatro telas que usam
    // este selo, só a Comercial envolve o conteúdo num `@container`, e nas
    // outras três as classes `@5xl:` ficariam inertes.
    <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2.5 text-xs sm:gap-3 lg:mb-6 lg:text-sm">
      <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 lg:px-3.5">
        <Circle className="h-2 w-2 shrink-0 fill-blue-600 text-blue-600" />
        <span className="min-w-0 break-words">Lendo: {descricao}</span>
      </span>
      {ativo && aviso ? (
        <span className="min-w-0 break-words text-slate-500">{aviso}</span>
      ) : null}
    </div>
  );
}
