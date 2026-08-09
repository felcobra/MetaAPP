"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  FolderPlus,
  GitBranch,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { NodeFormModal } from "./NodeFormModal";
import type { OrgDivisaoApi, OrgNoApi } from "@/types/orgchart";

interface OrgChartAdminProps {
  divisoes: OrgDivisaoApi[];
  onRefresh: () => void;
}

// ── Linha de nó editável na árvore ─────────────────────────────────────────

function AdminNoRow({
  no,
  divisaoId,
  depth,
  onRefresh,
}: {
  no: OrgNoApi;
  divisaoId: number;
  depth: number;
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function handleRemove() {
    if (
      !confirm(
        `Remover "${no.titulo}"? Todos os nós filhos também serão removidos.`
      )
    )
      return;
    setRemovendo(true);
    try {
      await apiFetch(`/rh/orgchart/nos/${no.id}`, { method: "DELETE" });
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao remover nó.");
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <>
      <div
        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {depth > 0 && (
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
          {no.titulo}
          {no.membro && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              — {no.membro.nome}
            </span>
          )}
        </span>

        {/* Ações visíveis no hover */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Adicionar nó filho"
            onClick={() => setShowModal(true)}
            className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Remover nó"
            onClick={handleRemove}
            disabled={removendo}
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            {removendo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Filhos recursivos */}
      {no.filhos?.map((filho) => (
        <AdminNoRow
          key={filho.id}
          no={filho}
          divisaoId={divisaoId}
          depth={depth + 1}
          onRefresh={onRefresh}
        />
      ))}

      {showModal && (
        <NodeFormModal
          divisaoId={divisaoId}
          parentId={no.id}
          parentTitulo={no.titulo}
          onSuccess={() => {
            setShowModal(false);
            onRefresh();
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Painel admin principal ─────────────────────────────────────────────────

export function OrgChartAdmin({ divisoes, onRefresh }: OrgChartAdminProps) {
  const [divSelecionadaId, setDivSelecionadaId] = useState<string>(
    divisoes[0]?.id ?? ""
  );
  const [showRootModal, setShowRootModal] = useState(false);

  // Formulário nova divisão
  const [showFormDiv, setShowFormDiv] = useState(false);
  const [nomeDiv, setNomeDiv] = useState("");
  const [slugDiv, setSlugDiv] = useState("");
  const [ordemDiv, setOrdemDiv] = useState("0");
  const [salvandoDiv, setSalvandoDiv] = useState(false);
  const [erroDiv, setErroDiv] = useState<string | null>(null);

  const divSelecionada = divisoes.find((d) => d.id === divSelecionadaId);

  // Gera slug automaticamente a partir do nome
  function handleNomeChange(nome: string) {
    setNomeDiv(nome);
    setSlugDiv(
      nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  async function handleCriarDivisao(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeDiv.trim() || !slugDiv.trim()) return;

    setSalvandoDiv(true);
    setErroDiv(null);
    try {
      const criada = await apiFetch<{ id: number; nome: string; slug: string }>(
        "/rh/orgchart/divisoes",
        {
          method: "POST",
          body: JSON.stringify({
            nome: nomeDiv.trim(),
            slug: slugDiv.trim(),
            ordem: Number(ordemDiv) || 0,
          }),
        }
      );
      setNomeDiv("");
      setSlugDiv("");
      setOrdemDiv("0");
      setShowFormDiv(false);
      onRefresh();
      // Seleciona a nova divisão após refresh
      setDivSelecionadaId(criada.slug);
    } catch (e: unknown) {
      setErroDiv(e instanceof Error ? e.message : "Erro ao criar divisão.");
    } finally {
      setSalvandoDiv(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
      {/* Cabeçalho do painel */}
      <div className="mb-4 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600">
          Modo de edição — Estrutura Organizacional
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* ── Coluna esquerda: divisões ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Divisões
          </p>

          {divisoes.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDivSelecionadaId(d.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                d.id === divSelecionadaId
                  ? "border-blue-300 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {d.label}
            </button>
          ))}

          {/* Formulário nova divisão */}
          {showFormDiv ? (
            <form
              onSubmit={handleCriarDivisao}
              className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-sm"
            >
              <div>
                <Label htmlFor="admin-nome-div" className="text-xs">
                  Nome
                </Label>
                <Input
                  id="admin-nome-div"
                  value={nomeDiv}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="ex: Diretoria"
                  className="h-9 text-xs"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="admin-slug-div" className="text-xs">
                  Slug (URL)
                </Label>
                <Input
                  id="admin-slug-div"
                  value={slugDiv}
                  onChange={(e) => setSlugDiv(e.target.value)}
                  placeholder="ex: diretoria"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-ordem-div" className="text-xs">
                  Ordem de exibição
                </Label>
                <Input
                  id="admin-ordem-div"
                  type="number"
                  value={ordemDiv}
                  onChange={(e) => setOrdemDiv(e.target.value)}
                  min={0}
                  className="h-9 text-xs"
                />
              </div>
              {erroDiv && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2 py-1 border border-red-100">
                  {erroDiv}
                </p>
              )}
              <div className="flex gap-1.5">
                <Button
                  type="submit"
                  size="sm"
                  disabled={salvandoDiv}
                  className="flex-1 h-8 text-xs"
                >
                  {salvandoDiv ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Criar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setShowFormDiv(false);
                    setErroDiv(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowFormDiv(true)}
              className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Nova divisão
            </button>
          )}
        </div>

        {/* ── Coluna direita: árvore editável ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 min-h-[200px]">
          {!divSelecionada ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Selecione ou crie uma divisão ao lado.
            </p>
          ) : !divSelecionada.root ? (
            /* Divisão existe mas sem nó raiz */
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-sm text-slate-500 text-center">
                <strong className="text-slate-700">{divSelecionada.label}</strong>{" "}
                ainda não tem nenhuma posição cadastrada.
              </p>
              <Button
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                iconPosition="left"
                onClick={() => setShowRootModal(true)}
              >
                Adicionar posição raiz
              </Button>
              {showRootModal && (
                <NodeFormModal
                  divisaoId={divSelecionada.divisao_num_id}
                  parentId={null}
                  onSuccess={() => {
                    setShowRootModal(false);
                    onRefresh();
                  }}
                  onClose={() => setShowRootModal(false)}
                />
              )}
            </div>
          ) : (
            /* Divisão com árvore */
            <div className="space-y-0.5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Hierarquia — {divSelecionada.label}
                </p>
                <button
                  type="button"
                  onClick={() => setShowRootModal(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Novo nó raiz
                </button>
              </div>

              <AdminNoRow
                no={divSelecionada.root}
                divisaoId={divSelecionada.divisao_num_id}
                depth={0}
                onRefresh={onRefresh}
              />

              {showRootModal && (
                <NodeFormModal
                  divisaoId={divSelecionada.divisao_num_id}
                  parentId={null}
                  onSuccess={() => {
                    setShowRootModal(false);
                    onRefresh();
                  }}
                  onClose={() => setShowRootModal(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
