"use client";

import { useState } from "react";
import { Wallet, FileText, ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { useApi, useApiVarios } from "@/lib/use-api";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { ErroCard, Skeleton, VazioCard } from "@/components/ui/AsyncState";
import { brl } from "@/lib/format";
import {
  mesCurto,
  type ContratosResumoApi,
  type PainelFinanceiroApi,
  type TransacoesApi,
} from "@/types/financial";

const PAGE_SIZE = 50;

function dataBR(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function FinancialContent() {
  const [pagina, setPagina] = useState(1);
  const [tipoTransacao, setTipoTransacao] = useState("todas");

  const painelState = useApiVarios<[PainelFinanceiroApi, ContratosResumoApi]>([
    "/financeiro/painel",
    "/financeiro/contratos-resumo?limit=50",
  ]);

  const filtroTipo = tipoTransacao === "todas" ? "" : `&tipo=${tipoTransacao}`;
  const transacoesState = useApi<TransacoesApi>(
    `/financeiro/transacoes?page=${pagina}&page_size=${PAGE_SIZE}${filtroTipo}`,
  );

  if (painelState.erro) {
    return <ErroCard erro={painelState.erro} titulo="Não foi possível carregar o financeiro" />;
  }

  if (painelState.carregando || !painelState.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const [painel, contratos] = painelState.data;
  const maxSaidaCategoria = Math.max(1, ...painel.saidas_por_categoria.map((c) => c.value));
  const maxFluxoMes = Math.max(1, ...painel.fluxo_mensal.flatMap((m) => [m.entradas, m.saidas]));

  return (
    <>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard
          label="Receita contratada"
          value={brl(painel.resumo.receita_contratada)}
          helper={`${painel.resumo.total_contratos} contratos`}
          icon={FileText}
        />
        <StatCard
          label="A receber"
          value={brl(painel.resumo.a_receber)}
          helper="soma das parcelas em aberto"
          icon={Wallet}
        />
        <StatCard
          label="Entradas"
          value={brl(painel.resumo.entradas)}
          icon={ArrowDownCircle}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Saídas"
          value={brl(painel.resumo.saidas)}
          icon={ArrowUpCircle}
          iconClassName="bg-red-50 text-red-500"
        />
        <StatCard
          label="Resultado"
          value={brl(painel.resumo.resultado)}
          helper="entradas − saídas"
          icon={Scale}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-bold text-slate-900">Fluxo de caixa mensal</h2>
          {painel.fluxo_mensal.length === 0 ? (
            <VazioCard mensagem="Sem transações no período." />
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {painel.fluxo_mensal.map((m) => (
                <div key={m.mes} className="flex min-w-[2.5rem] flex-col items-center gap-1">
                  <div className="flex h-32 items-end gap-0.5">
                    <div
                      className="w-2.5 rounded-t bg-emerald-500"
                      style={{ height: `${(m.entradas / maxFluxoMes) * 100}%` }}
                      title={`Entradas: ${brl(m.entradas)}`}
                    />
                    <div
                      className="w-2.5 rounded-t bg-red-400"
                      style={{ height: `${(m.saidas / maxFluxoMes) * 100}%` }}
                      title={`Saídas: ${brl(m.saidas)}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{mesCurto(m.mes)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-bold text-slate-900">Saídas por categoria</h2>
          {painel.saidas_por_categoria.length === 0 ? (
            <VazioCard mensagem="Sem saídas categorizadas." />
          ) : (
            <ul className="flex flex-col gap-3">
              {painel.saidas_por_categoria.map((c) => (
                <li key={c.label} className="grid min-w-0 grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="truncate text-xs font-medium text-slate-700">{c.label}</span>
                  <div className="h-2.5 min-w-0 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${(c.value / maxSaidaCategoria) * 100}%` }} />
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold text-slate-900">{brl(c.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900">Contratos</h2>
      <Card padding="none" className="mb-8 overflow-hidden">
        {contratos.items.length === 0 ? (
          <VazioCard mensagem="Nenhum contrato cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-sm font-extrabold text-slate-950">
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Fase</th>
                  <th className="px-4 py-3">Parcelas</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {contratos.items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-extrabold text-slate-700">{c.numero}</td>
                    <td className="max-w-48 truncate px-4 py-2.5 font-bold text-slate-700">{c.cliente}</td>
                    <td className="max-w-48 truncate px-4 py-2.5 text-slate-500">{c.projeto}</td>
                    <td className="px-4 py-2.5"><Badge tone="neutral" className="normal-case tracking-normal">{c.fase_atual}</Badge></td>
                    <td className="px-4 py-2.5 text-slate-500">{c.parcelas_pagas}/{c.parcelas_total}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{brl(c.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Transações</h2>
        <Tabs
          size="sm"
          value={tipoTransacao}
          onChange={(id) => {
            setTipoTransacao(id);
            setPagina(1);
          }}
          options={[
            { id: "todas", label: "Todas" },
            { id: "entrada", label: "Entradas" },
            { id: "saida", label: "Saídas" },
          ]}
        />
      </div>
      <Card padding="none" className="overflow-hidden">
        {transacoesState.erro ? (
          <ErroCard erro={transacoesState.erro} titulo="Não foi possível carregar as transações" />
        ) : transacoesState.carregando || !transacoesState.data ? (
          <div className="p-5"><Skeleton className="h-64" /></div>
        ) : transacoesState.data.items.length === 0 ? (
          <VazioCard mensagem="Nenhuma transação no filtro selecionado." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-sm font-extrabold text-slate-950">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Conta</th>
                    <th className="px-4 py-3">Vínculo</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoesState.data.items.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-2.5 font-bold text-slate-500">{dataBR(t.data)}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.categoria}</td>
                      <td className="px-4 py-2.5 text-slate-500">{t.conta}</td>
                      <td className="max-w-48 truncate px-4 py-2.5 text-slate-500">{t.vinculo ?? "—"}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-2.5 text-right font-bold ${
                          t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {t.tipo === "entrada" ? "+" : "−"} {brl(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 p-4 text-sm font-bold text-slate-500">
              <span>
                Exibindo {transacoesState.data.page_from} a {transacoesState.data.page_to} de {transacoesState.data.total}.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(transacoesState.data!.total_pages, p + 1))}
                  disabled={pagina === transacoesState.data.total_pages}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
