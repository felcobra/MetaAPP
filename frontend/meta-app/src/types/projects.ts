/** Espelha o enum projeto_externo.status do banco — o ciclo de vida do
 * projeto (ativo/pausado/finalizado), não a saúde do cronograma. É o que a
 * BDU mostra nos cards e nas abas de filtro ("Em execução/Concluídos/
 * Pausados"): todo projeto tem um valor aqui, diferente do status derivado
 * do PAPE (`ProjectStatus`, em dashboard.ts), que fica "sem-dados" pra
 * qualquer projeto sem health-check respondido — a maioria, na prática. */
export type ProjectLifecycleStatus = "ativo" | "pausado" | "finalizado";

export interface ExternalProject {
  id: string;
  code: string;
  name: string;
  client: string;
  area: string;
  manager: string;
  status: ProjectLifecycleStatus;
  progress: number;
}

export type ExternalProjectFilter = "todos" | ProjectLifecycleStatus;

/** GET /projetos/board */
export interface ProjetoBoardApi {
  id: number;
  nome: string;
  cliente: string;
  area: string;
  gerente: string;
  status_projeto: ProjectLifecycleStatus | null;
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
    name: p.nome,
    client: p.cliente,
    area: p.area,
    manager: p.gerente,
    // Nulo é raro na prática, mas o enum é nullable no banco — cai em
    // "ativo" em vez de quebrar o mapa de cor/rótulo do badge.
    status: p.status_projeto ?? "ativo",
    progress: p.progresso,
  };
}
