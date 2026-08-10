"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

interface MembroSimples {
  id: number;
  nome: string;
}

interface CargoSimples {
  id: number;
  nome: string;
}

interface CoordenacaoSimples {
  id: number;
  nome: string;
}

interface NodeFormModalProps {
  divisaoId: number;
  parentId: number | null;
  parentTitulo?: string;
  /** Presente = modo edição: título/membro/cargo de um nó já existente (PATCH em vez de POST). */
  editNo?: {
    id: number;
    titulo: string;
    membroId: number | null;
    cargoId: number | null;
    coordenacaoId: number | null;
  };
  onSuccess: () => void;
  onClose: () => void;
}

export function NodeFormModal({
  divisaoId,
  parentId,
  parentTitulo,
  editNo,
  onSuccess,
  onClose,
}: NodeFormModalProps) {
  const [titulo, setTitulo] = useState(editNo?.titulo ?? "");
  const [modo, setModo] = useState<"pessoa" | "time">(editNo?.cargoId ? "time" : "pessoa");
  const [membroId, setMembroId] = useState<string>(
    editNo?.membroId ? String(editNo.membroId) : ""
  );
  const [cargoId, setCargoId] = useState<string>(editNo?.cargoId ? String(editNo.cargoId) : "");
  const [coordenacaoId, setCoordenacaoId] = useState<string>(
    editNo?.coordenacaoId ? String(editNo.coordenacaoId) : ""
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: membros, carregando: carregandoMembros } =
    useApi<MembroSimples[]>("/rh/membros?apenas_ativos=true");
  const { data: cargos, carregando: carregandoCargos } = useApi<CargoSimples[]>("/rh/cargos");
  const { data: coordenacoes, carregando: carregandoCoordenacoes } =
    useApi<CoordenacaoSimples[]>("/rh/coordenacoes");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (modo === "time" && !cargoId) return;

    setSalvando(true);
    setErro(null);

    const campos =
      modo === "time"
        ? {
            membro_id: null,
            cargo_id: Number(cargoId),
            coordenacao_id: coordenacaoId ? Number(coordenacaoId) : null,
          }
        : {
            membro_id: membroId ? Number(membroId) : null,
            cargo_id: null,
            coordenacao_id: null,
          };

    try {
      if (editNo) {
        await apiFetch(`/rh/orgchart/nos/${editNo.id}`, {
          method: "PATCH",
          body: JSON.stringify({ titulo: titulo.trim(), ...campos }),
        });
      } else {
        await apiFetch("/rh/orgchart/nos", {
          method: "POST",
          body: JSON.stringify({
            divisao_id: divisaoId,
            parent_id: parentId ?? null,
            titulo: titulo.trim(),
            ordem: 0,
            ...campos,
          }),
        });
      }
      onSuccess();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar nó.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              {editNo ? "Editar posição" : parentTitulo ? `Filho de "${parentTitulo}"` : "Nó raiz"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {editNo ? editNo.titulo : "Adicionar posição"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título do cargo */}
          <div>
            <Label htmlFor="node-titulo">Título do cargo / posição *</Label>
            <Input
              id="node-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ex: Presidente, Consultores…"
              required
              autoFocus
            />
          </div>

          {/* Pessoa única × time */}
          <div>
            <Label>Este nó representa</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModo("pessoa")}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition-colors",
                  modo === "pessoa"
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                )}
              >
                1 pessoa
              </button>
              <button
                type="button"
                onClick={() => setModo("time")}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition-colors",
                  modo === "time"
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                )}
              >
                Um time (por cargo)
              </button>
            </div>
          </div>

          {modo === "pessoa" ? (
            /* Membro responsável */
            <div>
              <Label htmlFor="node-membro">Membro responsável (opcional)</Label>
              {carregandoMembros ? (
                <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">Carregando membros…</span>
                </div>
              ) : (
                <select
                  id="node-membro"
                  value={membroId}
                  onChange={(e) => setMembroId(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">— Sem membro vinculado —</option>
                  {(membros ?? []).map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              {/* Cargo do time */}
              <div>
                <Label htmlFor="node-cargo">Cargo *</Label>
                {carregandoCargos ? (
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-400">Carregando cargos…</span>
                  </div>
                ) : (
                  <select
                    id="node-cargo"
                    value={cargoId}
                    onChange={(e) => setCargoId(e.target.value)}
                    required
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Selecione o cargo…</option>
                    {(cargos ?? []).map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1.5 text-xs text-slate-400">
                  Todo mundo com esse cargo no RH entra automaticamente no card do time —
                  nada é cadastrado pessoa a pessoa aqui.
                </p>
              </div>

              {/* Coordenação (refina) */}
              <div>
                <Label htmlFor="node-coordenacao">Coordenação (opcional, para refinar)</Label>
                {carregandoCoordenacoes ? (
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-400">Carregando coordenações…</span>
                  </div>
                ) : (
                  <select
                    id="node-coordenacao"
                    value={coordenacaoId}
                    onChange={(e) => setCoordenacaoId(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todas as coordenações</option>
                    {(coordenacoes ?? []).map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          {/* Erro */}
          {erro && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !titulo.trim() || (modo === "time" && !cargoId)}
            >
              {salvando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando…
                </>
              ) : editNo ? (
                "Salvar alterações"
              ) : (
                "Salvar posição"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
