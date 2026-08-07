"use client";

import { useApiVarios } from "@/lib/use-api";
import { FormsBoard } from "@/components/forms/FormsBoard";
import { FormHistoryList } from "@/components/forms/FormHistoryList";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import {
  normalizarTarefa,
  type FormHistoryItem,
  type HistoricoApi,
  type TarefaApi,
} from "@/types/forms";

export function FormsContent() {
  const { data, erro, carregando } = useApiVarios<[TarefaApi[], HistoricoApi[]]>([
    "/formularios/minhas-tarefas",
    "/formularios/historico",
  ]);

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar os formulários" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const [tarefas, historico] = data;

  const itens: FormHistoryItem[] = historico.map((h) => ({
    id: String(h.id),
    title: `${h.titulo} — ${h.ciclo}`,
    client: h.projeto ?? "Sem projeto vinculado",
    date: h.data_submissao
      ? new Date(h.data_submissao).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
  }));

  return (
    <>
      <FormsBoard tasks={tarefas.map(normalizarTarefa)} />
      <FormHistoryList items={itens} />
    </>
  );
}
