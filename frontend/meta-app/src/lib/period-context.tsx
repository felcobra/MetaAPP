"use client";

/**
 * Recorte de período — estado compartilhado da barra do topo.
 *
 * Uma única escolha de período vale para todas as telas analíticas
 * (Comercial, Financeiro, Projetos externos, Dashboards): a pessoa marca
 * "26.1" no topo e navega entre elas sem remarcar.
 *
 * O provider mora no RootLayout, não no AppShell. O AppShell é montado por
 * cada página, então guardar o estado nele faria o período voltar para "Tudo"
 * a cada navegação — o layout raiz sobrevive à troca de rota no App Router.
 *
 * A escolha NÃO é persistida em localStorage: ler storage na primeira
 * renderização faz o servidor e o cliente renderizarem chips diferentes
 * (hydration mismatch), e corrigir isso num efeito cai no mesmo
 * set-state-in-effect que o auth-context evita de propósito. Na prática o
 * período sobrevive à navegação e reseta num F5, que é o comportamento menos
 * surpreendente entre os dois.
 *
 * Seleção única com desmarcar: só um período vale por vez, e clicar no chip
 * já marcado o desliga. "Sem nada marcado" é o estado que antes era um chip
 * "Tudo" — por isso ele não existe mais. Um chip que representa "não filtrar"
 * é um chip que compete com os outros para dizer a ausência de recorte; o
 * estado vazio já diz isso sozinho.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type PeriodKey = "30d" | "s1" | "s2" | "ano";

export interface PeriodOption {
  key: PeriodKey;
  /** Rótulo curto do chip (ex: "26.1"). */
  label: string;
  /** Frase inteira, para o aviso "Lendo: ..." dentro da página. */
  descricao: string;
}

interface Intervalo {
  inicio: string;
  fim: string;
}

interface PeriodContextValue {
  /** null = nada marcado, ou seja, todo o histórico. */
  periodo: PeriodKey | null;
  /** Liga o período; se já for o que está ligado, desliga (volta ao histórico). */
  alternarPeriodo: (key: PeriodKey) => void;
  opcoes: PeriodOption[];
  /** Frase do período atual, para exibir na página. */
  descricao: string;
  /** False quando nada está marcado — nenhum recorte aplicado. */
  ativo: boolean;
  /**
   * Anexa `data_inicio`/`data_fim` a um caminho de API. Sem período marcado
   * devolve o caminho intacto, então dá para chamar sempre, sem `if` na tela.
   */
  comPeriodo: (path: string) => string;
}

// ── Datas ─────────────────────────────────────────────────────────────────────
function iso(d: Date): string {
  // Formata em horário local. `toISOString()` converte para UTC antes de
  // cortar, o que no Brasil (UTC-3) devolve o dia anterior para qualquer
  // data construída à meia-noite — o recorte inteiro sairia deslocado em 1 dia.
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function intervaloDe(key: PeriodKey, hoje: Date): Intervalo {
  const ano = hoje.getFullYear();

  switch (key) {
    case "30d": {
      const inicio = new Date(hoje);
      // Usa a data real do momento em que o periodo foi acionado.
      // "30 dias" significa de hoje ate 30 dias atras, inclusive.
      inicio.setDate(inicio.getDate() - 30);
      return { inicio: iso(inicio), fim: iso(hoje) };
    }
    case "s1":
      return { inicio: `${ano}-01-01`, fim: `${ano}-06-30` };
    case "s2":
      return { inicio: `${ano}-07-01`, fim: `${ano}-12-31` };
    case "ano":
      return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
  }
}

/**
 * Os rótulos saem do ano corrente, não fixos no código: "26.1" vira "27.1"
 * sozinho na virada do ano, em vez de mostrar um semestre que já passou.
 */
function opcoesDe(hoje: Date): PeriodOption[] {
  const ano = hoje.getFullYear();
  const curto = String(ano).slice(-2);

  return [
    { key: "30d", label: "30 dias", descricao: "Últimos 30 dias" },
    { key: "s1", label: `${curto}.1`, descricao: `1º semestre de ${ano}` },
    { key: "s2", label: `${curto}.2`, descricao: `2º semestre de ${ano}` },
    { key: "ano", label: String(ano), descricao: `Ano de ${ano}` },
  ];
}

/** Estado sem nada marcado. Não é opção de chip — é a ausência de todas. */
const SEM_RECORTE = "Todo o histórico";

// ── Context ───────────────────────────────────────────────────────────────────
const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  // Começa sem recorte: é o que as telas mostravam antes de existir filtro.
  // Abrir o app com um período já aplicado mudaria todos os números sem que
  // ninguém tivesse pedido.
  const [periodo, setPeriodo] = useState<PeriodKey | null>(null);

  // Guarda a data usada pelo recorte. Ela e atualizada quando a pessoa aciona
  // um chip, evitando que "30 dias" fique preso ao momento em que o app abriu.
  const [hoje, setHoje] = useState(() => new Date());

  const opcoes = useMemo(() => opcoesDe(hoje), [hoje]);
  const intervalo = useMemo(
    () => (periodo ? intervaloDe(periodo, hoje) : null),
    [periodo, hoje],
  );

  // Clicar no chip aceso apaga. É o que substitui o antigo "Tudo".
  const alternarPeriodo = useCallback((key: PeriodKey) => {
    setHoje(new Date());
    setPeriodo((atual) => (atual === key ? null : key));
  }, []);

  const comPeriodo = useCallback(
    (path: string): string => {
      if (!intervalo) return path;

      const params = new URLSearchParams({
        data_inicio: intervalo.inicio,
        data_fim: intervalo.fim,
      });

      // A rota pode já ter query própria (ex: paginação da tabela).
      const separador = path.includes("?") ? "&" : "?";
      return `${path}${separador}${params.toString()}`;
    },
    [intervalo],
  );

  const descricao = periodo
    ? (opcoes.find((o) => o.key === periodo)?.descricao ?? SEM_RECORTE)
    : SEM_RECORTE;

  return (
    <PeriodContext.Provider
      value={{
        periodo,
        alternarPeriodo,
        opcoes,
        descricao,
        ativo: periodo !== null,
        comPeriodo,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) {
    throw new Error("usePeriod() deve ser usado dentro de <PeriodProvider>.");
  }
  return ctx;
}
