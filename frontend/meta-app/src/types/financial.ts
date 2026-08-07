/** GET /financeiro/painel */
export interface PainelFinanceiroApi {
  resumo: {
    receita_contratada: number;
    total_contratos: number;
    a_receber: number;
    entradas: number;
    saidas: number;
    resultado: number;
  };
  fluxo_mensal: { mes: string; entradas: number; saidas: number }[];
  saidas_por_categoria: { label: string; value: number }[];
  saldo_por_conta: { label: string; value: number }[];
}

/** GET /financeiro/contratos-resumo */
export interface ContratosResumoApi {
  items: {
    id: number;
    numero: string;
    cliente: string;
    projeto: string;
    fase_atual: string;
    parcelas_pagas: number;
    parcelas_total: number;
    valor_total: number;
  }[];
  total: number;
}

/** GET /financeiro/transacoes */
export interface TransacoesApi {
  items: {
    id: number;
    data: string | null;
    tipo: "entrada" | "saida";
    valor: number;
    categoria: string;
    conta: string;
    vinculo: string | null;
  }[];
  total: number;
  total_pages: number;
  current_page: number;
  page_from: number;
  page_to: number;
}

/** "2026-03" -> "mar/26" — mesmo formato compacto usado nos outros gráficos por mês. */
export function mesCurto(isoMes: string): string {
  const [ano, mes] = isoMes.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const indice = Number(mes) - 1;
  return `${nomes[indice] ?? mes}/${ano.slice(2)}`;
}
