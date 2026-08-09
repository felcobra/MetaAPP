"use client";

import { useCallback, useState } from "react";
import { Settings2, EyeOff } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { OrgChartExplorer } from "@/components/orgchart/OrgChartExplorer";
import { OrgChartAdmin } from "@/components/orgchart/OrgChartAdmin";
import { ErroCard, Skeleton } from "@/components/ui/AsyncState";
import {
  normalizarDivisoes,
  type OrgDivisaoApi,
} from "@/types/orgchart";

/** Roles que podem editar o organograma. */
const ROLES_ADMIN = new Set(["admin", "director"]);

export function OrgChartContent() {
  const { user } = useAuth();
  const podeEditar = user ? ROLES_ADMIN.has(user.role) : false;

  // Chave de revalidação: incrementar força novo fetch sem precisar recarregar a página.
  const [rev, setRev] = useState(0);
  const refresh = useCallback(() => setRev((n) => n + 1), []);

  const { data, erro, carregando } = useApi<OrgDivisaoApi[]>(
    `/rh/orgchart?_rev=${rev}`
  );

  // Modo de edição: abre automaticamente se admin e não há divisões ainda.
  const [modoEdicao, setModoEdicao] = useState(false);

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar o organograma" />;
  if (carregando || !data) return <Skeleton className="h-[70vh]" />;

  const divisoes = normalizarDivisoes(data);
  const organogramaVazio = divisoes.length === 0;

  // Admin vê o painel mesmo com organograma vazio (para popular)
  const mostrarAdmin = podeEditar && (modoEdicao || organogramaVazio);

  return (
    <div>
      {/* Botão de edição — só aparece para admins quando o organograma já tem dados */}
      {podeEditar && !organogramaVazio && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModoEdicao((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              modoEdicao
                ? "border-blue-300 bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {modoEdicao ? (
              <>
                <EyeOff className="h-4 w-4" />
                Sair do modo edição
              </>
            ) : (
              <>
                <Settings2 className="h-4 w-4" />
                Editar estrutura
              </>
            )}
          </button>
        </div>
      )}

      {/* Visualização normal do organograma */}
      {!mostrarAdmin && organogramaVazio ? (
        <ErroCard
          titulo="Organograma vazio"
          erro={
            podeEditar
              ? "Nenhuma divisão cadastrada ainda. Use o painel abaixo para montar a hierarquia."
              : "Nenhuma divisão com estrutura montada. As tabelas org_divisao e org_no são exclusivas do MetaApp e começam vazias — a hierarquia precisa ser cadastrada por um administrador."
          }
        />
      ) : null}

      {!mostrarAdmin && !organogramaVazio ? (
        <OrgChartExplorer divisions={divisoes} />
      ) : null}

      {/* Painel de edição (admin) */}
      {mostrarAdmin && (
        <OrgChartAdmin divisoes={data} onRefresh={refresh} />
      )}
    </div>
  );
}
