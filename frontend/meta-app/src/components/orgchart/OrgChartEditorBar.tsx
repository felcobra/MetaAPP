"use client";

import { AlertCircle, Check, Pencil, X } from "lucide-react";

interface OrgChartEditorBarProps {
  modoEdicao: boolean;
  aviso: string | null;
  onIniciar: () => void;
  onSalvar: () => void;
  onCancelar: () => void;
}

/** Mesma linguagem visual do ZoomControls: cartão branco, borda clara, sombra. */
const caixa = "rounded-xl border border-slate-200 bg-white p-1 shadow-sm";

export function OrgChartEditorBar({
  modoEdicao,
  aviso,
  onIniciar,
  onSalvar,
  onCancelar,
}: OrgChartEditorBarProps) {
  return (
    <div className="absolute right-5 top-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-col items-end gap-2">
      {modoEdicao ? (
        <div className={`flex items-center gap-0.5 ${caixa}`}>
          <button
            type="button"
            onClick={onSalvar}
            title="Salvar alterações"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Salvar alterações</span>
          </button>
          <button
            type="button"
            onClick={onCancelar}
            title="Cancelar"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <X className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>
        </div>
      ) : (
        <div className={caixa}>
          <button
            type="button"
            onClick={onIniciar}
            title="Editar organograma"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <Pencil className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Editar organograma</span>
          </button>
        </div>
      )}

      {aviso ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="text-right">{aviso}</span>
        </p>
      ) : null}
    </div>
  );
}
