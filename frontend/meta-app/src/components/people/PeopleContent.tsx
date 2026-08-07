"use client";

import { Users, Layers3, Network } from "lucide-react";
import { useApiVarios } from "@/lib/use-api";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ErroCard, Skeleton, VazioCard } from "@/components/ui/AsyncState";
import { agruparPorCelula, type CelulaApi, type CoordenacaoApi, type DiretorioMembroApi } from "@/types/people";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : [partes[0]];
  return primeiras.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function PeopleContent() {
  const { data, erro, carregando } = useApiVarios<[DiretorioMembroApi[], CelulaApi[], CoordenacaoApi[]]>([
    "/rh/diretorio",
    "/rh/celulas",
    "/rh/coordenacoes",
  ]);

  if (erro) return <ErroCard erro={erro} titulo="Não foi possível carregar o mapa de pessoas" />;

  if (carregando || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const [membros, celulas, coordenacoes] = data;

  if (membros.length === 0) {
    return <VazioCard mensagem="Nenhum membro cadastrado." />;
  }

  const grupos = agruparPorCelula(membros, celulas);

  return (
    <>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard label="Membros mapeados" value={membros.length} icon={Users} />
        <StatCard
          label="Células"
          value={celulas.length}
          helper="núcleos organizacionais"
          icon={Layers3}
        />
        <StatCard
          label="Coordenações"
          value={coordenacoes.length}
          helper="áreas técnicas"
          icon={Network}
        />
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900">Pessoas por célula</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {grupos.map((grupo) => (
          <Card key={grupo.id} className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">{grupo.nome}</p>
                {grupo.sigla ? <p className="text-xs font-semibold text-slate-400">{grupo.sigla}</p> : null}
              </div>
              <Badge tone="info">{grupo.membros.length} {grupo.membros.length === 1 ? "membro" : "membros"}</Badge>
            </div>

            <ul className="flex flex-col gap-3">
              {grupo.membros.map((membro) => (
                <li key={membro.id} className="flex min-w-0 items-center gap-3">
                  <Avatar initials={iniciais(membro.nome)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{membro.nome}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {membro.cargos.map((c) => (
                        <span key={c.id} className="text-xs font-medium text-slate-400">
                          {c.nome}
                        </span>
                      ))}
                      {membro.coordenacoes.map((c) => (
                        <Badge key={c.id} tone="neutral" className="normal-case tracking-normal">
                          {c.sigla ?? c.nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
