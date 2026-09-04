"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  Loader2,
  FolderPlus,
  GitBranch,
  GripVertical,
  Info,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useOrgChartEditor, type OrgNodeEdicao } from "@/lib/use-orgchart-editor";
import { FORMATO_ORG_NO_API } from "@/lib/orgchart-tree";
import { chaveDeArmazenamento } from "@/lib/orgchart-storage";
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
  propsDeArraste,
}: {
  no: OrgNoApi;
  divisaoId: number;
  depth: number;
  onRefresh: () => void;
  /** Props de arraste do nó — vem do hook e desce pela recursão. */
  propsDeArraste: (id: string) => OrgNodeEdicao | undefined;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const edicao = propsDeArraste(String(no.id));

  return (
    <>
      <div
        data-admin-row={no.titulo}
        onDragOver={edicao?.onDragOver}
        onDragLeave={edicao?.onDragLeave}
        onDrop={edicao?.onDrop}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50",
          // Linha em movimento: apagada, para o destaque ficar nos destinos.
          edicao?.arrastando && "opacity-40",
          // Destinos que aceitam o cargo: fundo levemente azulado.
          edicao?.destinoPossivel && !edicao.destinoAtivo && "bg-blue-50/50",
          // Destino sob o cursor: confirmação forte de onde o cargo vai cair.
          edicao?.destinoAtivo && "bg-blue-100 ring-1 ring-blue-500 hover:bg-blue-100",
          // Movimento proibido (ele mesmo, própria equipe, gestor atual).
          edicao?.destinoInvalido && "bg-amber-50 ring-1 ring-amber-400 hover:bg-amber-50",
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* Só a alça é arrastável: assim clicar nos botões de ação da linha
            nunca é confundido com o começo de um arraste. */}
        {edicao?.arrastavel ? (
          <span
            draggable
            onDragStart={edicao.onDragStart}
            onDragEnd={edicao.onDragEnd}
            title="Arraste para mudar o gestor deste cargo"
            className="shrink-0 cursor-grab text-slate-300 transition-colors hover:text-blue-500 active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        ) : (
          /* A raiz não tem gestor acima; o espaço mantém as linhas alinhadas. */
          <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}

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
          {no.equipe && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              — {no.equipe.cargo_nome ?? "seleção manual"}
              {no.equipe.coordenacao_nome ? ` · ${no.equipe.coordenacao_nome}` : ""} (
              {no.equipe.membros.length} {no.equipe.membros.length === 1 ? "pessoa" : "pessoas"})
            </span>
          )}
        </span>

        {/* Ações visíveis no hover */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Editar título/membro"
            onClick={() => setShowEditModal(true)}
            className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
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
          propsDeArraste={propsDeArraste}
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

      {showEditModal && (
        <NodeFormModal
          divisaoId={divisaoId}
          parentId={no.id}
          editNo={{
            id: no.id,
            titulo: no.titulo,
            membroId: no.membro?.id ?? null,
            cargoId: no.equipe?.cargo_id ?? null,
            coordenacaoId: no.equipe?.coordenacao_id ?? null,
            membroIdsManual: no.equipe?.membro_ids_manual ?? [],
          }}
          onSuccess={() => {
            setShowEditModal(false);
            onRefresh();
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

// ── Hierarquia arrastável de uma divisão ───────────────────────────────────

/**
 * A lista de cargos da divisão selecionada, com arraste para trocar o gestor.
 *
 * Usa o MESMO hook do gráfico (`useOrgChartEditor`), só com outro formato de
 * árvore — então as regras (não virar pai de si mesmo, não criar ciclo, não
 * mover a raiz) e a chave de localStorage são as mesmas nas duas telas: o que
 * você reorganiza aqui aparece no organograma visual também.
 */
function AdminHierarquia({
  raiz,
  divisaoId,
  divisaoSlug,
  label,
  onRefresh,
  onNovoRaiz,
}: {
  raiz: OrgNoApi;
  divisaoId: number;
  /** Slug da divisão — a chave de localStorage é por divisão. */
  divisaoSlug: string;
  label: string;
  onRefresh: () => void;
  onNovoRaiz: () => void;
}) {
  const editor = useOrgChartEditor(
    raiz,
    chaveDeArmazenamento(divisaoSlug),
    FORMATO_ORG_NO_API,
    // O painel já É a tela de edição, então o arraste fica sempre disponível.
    { sempreEditando: true },
  );

  return (
    <div className="space-y-0.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Hierarquia — {label}
        </p>
        <button
          type="button"
          onClick={onNovoRaiz}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Novo nó raiz
        </button>
      </div>

      {/* Deixa explícito que reorganizar aqui não grava no banco — a API não
          tem operação de mover nó, só criar, editar título/membro e remover. */}
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">
          Arraste um cargo pela alça e solte sobre o novo gestor para mudar a
          hierarquia. Esta reorganização vale{" "}
          <strong className="font-semibold text-slate-600">
            somente neste navegador
          </strong>{" "}
          — o banco de dados não é alterado. Criar, editar ou remover um cargo,
          sim, é salvo no banco e descarta a reorganização pendente.
        </p>
      </div>

      {editor.aviso ? (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {editor.aviso}
        </p>
      ) : null}

      <AdminNoRow
        no={editor.arvoreExibida}
        divisaoId={divisaoId}
        depth={0}
        onRefresh={onRefresh}
        propsDeArraste={editor.propsDeArraste}
      />

      {editor.temAlteracoes ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Button
            size="sm"
            className="h-8 text-xs"
            icon={<Check className="h-3.5 w-3.5" />}
            iconPosition="left"
            onClick={editor.salvar}
          >
            Salvar localmente
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs"
            icon={<X className="h-3.5 w-3.5" />}
            iconPosition="left"
            onClick={editor.cancelar}
          >
            Descartar
          </Button>
        </div>
      ) : null}
    </div>
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
              {/* key por divisão: cada área tem a sua própria reorganização. */}
              <AdminHierarquia
                key={divSelecionada.id}
                raiz={divSelecionada.root}
                divisaoId={divSelecionada.divisao_num_id}
                divisaoSlug={divSelecionada.id}
                label={divSelecionada.label}
                onRefresh={onRefresh}
                onNovoRaiz={() => setShowRootModal(true)}
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
