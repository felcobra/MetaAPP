import { Card, CardEyebrow } from "@/components/ui/Card";
import { brl } from "@/lib/format";
import type { HomeData } from "@/types/home";

/**
 * A versão em mocks mostrava barra de progresso, "meta para subir no palco"
 * (R$ 140.000) e o gap até ela. Nada disso existe no banco: não há tabela,
 * coluna ou registro de meta de faturamento em lugar nenhum do schema, então
 * a barra e o percentual seriam calculados sobre um número inventado.
 *
 * Enquanto a meta não tiver onde morar, o card mostra o que é apurável: quanto
 * entrou no mês, quanto entrou no total e quanto está em negociação.
 */
export function RevenueProgressCard({ revenue }: { revenue: HomeData["revenue"] }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <div>
          <CardEyebrow>FATURAMENTO</CardEyebrow>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Entradas do período</h3>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          RECEBIDO NESTE MÊS
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{brl(revenue.fat_atual)}</p>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            RECEBIDO NO TOTAL
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{brl(revenue.fat_total)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            EM NEGOCIAÇÃO
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {brl(revenue.em_negociacao_valor)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {revenue.em_negociacao_count}{" "}
            {revenue.em_negociacao_count === 1 ? "oportunidade" : "oportunidades"}
          </p>
        </div>
      </div>
    </Card>
  );
}
