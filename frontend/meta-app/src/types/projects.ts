import type { ProjectStatus } from "./dashboard";

export interface ExternalProject {
  id: string;
  code: string;
  client: string;
  area: string;
  manager: string;
  status: ProjectStatus;
  progress: number;
}

export type ExternalProjectFilter = "todos" | ProjectStatus;

/** GET /projetos/board */
export interface ProjetoBoardApi {
  id: number;
  nome: string;
  cliente: string;
  area: string;
  gerente: string;
  status: ProjectStatus;
  status_projeto: string | null;
  progresso: number;
}

/** Iniciais para o avatar do card — o mock trazia "SI", "VI" escritos à mão. */
function iniciais(texto: string): string {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "??";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function normalizarProjeto(p: ProjetoBoardApi): ExternalProject {
  return {
    id: String(p.id),
    code: iniciais(p.cliente),
    client: p.cliente,
    area: p.area,
    manager: p.gerente,
    status: p.status,
    progress: p.progresso,
  };
}
