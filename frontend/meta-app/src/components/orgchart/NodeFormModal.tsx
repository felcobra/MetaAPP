"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

interface MembroSimples {
  id: number;
  nome: string;
}

interface NodeFormModalProps {
  divisaoId: number;
  parentId: number | null;
  parentTitulo?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function NodeFormModal({
  divisaoId,
  parentId,
  parentTitulo,
  onSuccess,
  onClose,
}: NodeFormModalProps) {
  const [titulo, setTitulo] = useState("");
  const [membroId, setMembroId] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: membros, carregando: carregandoMembros } =
    useApi<MembroSimples[]>("/rh/membros?apenas_ativos=true");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;

    setSalvando(true);
    setErro(null);

    try {
      await apiFetch("/rh/orgchart/nos", {
        method: "POST",
        body: JSON.stringify({
          divisao_id: divisaoId,
          parent_id: parentId ?? null,
          membro_id: membroId ? Number(membroId) : null,
          titulo: titulo.trim(),
          ordem: 0,
        }),
      });
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
              {parentTitulo ? `Filho de "${parentTitulo}"` : "Nó raiz"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Adicionar posição
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
              placeholder="ex: Presidente, Diretor de RH…"
              required
              autoFocus
            />
          </div>

          {/* Membro responsável */}
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
              disabled={salvando || !titulo.trim()}
            >
              {salvando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando…
                </>
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
