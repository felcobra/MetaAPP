import { Wrench, type LucideIcon } from "lucide-react";

export interface PortfolioService {
  icon: LucideIcon;
  name: string;
  iconClassName: string;
}

export interface PortfolioCoordination {
  code: string;
  name: string;
  accentClassName: string;
  dotClassName: string;
  opportunities: number;
  services: PortfolioService[];
}

/** GET /portfolio/coordenacoes */
export interface CoordenacaoApi {
  id: number;
  nome: string;
  sigla: string | null;
  total_oportunidades: number;
  servicos: { id: number; nome: string }[];
}

/**
 * Paleta por posição. As cores eram fixas por sigla no mock (CE vermelho, GN
 * azul…), mas a tabela `coordenacao` é editável pelo app — uma coordenação
 * nova ficaria sem cor. Atribuir por posição garante cor para qualquer
 * quantidade de coordenações.
 */
const PALETA = [
  { accent: "border-t-4 border-t-red-400", dot: "bg-red-400", icone: "bg-red-50 text-red-500" },
  { accent: "border-t-4 border-t-blue-500", dot: "bg-blue-500", icone: "bg-blue-50 text-blue-600" },
  { accent: "border-t-4 border-t-emerald-500", dot: "bg-emerald-500", icone: "bg-emerald-50 text-emerald-600" },
  { accent: "border-t-4 border-t-amber-400", dot: "bg-amber-400", icone: "bg-amber-50 text-amber-600" },
  { accent: "border-t-4 border-t-violet-500", dot: "bg-violet-500", icone: "bg-violet-50 text-violet-600" },
  { accent: "border-t-4 border-t-cyan-500", dot: "bg-cyan-500", icone: "bg-cyan-50 text-cyan-600" },
];

/**
 * Cada serviço tinha um ícone escolhido a dedo no mock (prédio para
 * Autovistoria Predial, raio para Instalações Elétricas). A tabela `servico`
 * guarda só o nome, então não há como saber qual ícone corresponde a qual
 * serviço — todos recebem o mesmo, na cor da coordenação.
 */
export function normalizarCoordenacao(c: CoordenacaoApi, indice: number): PortfolioCoordination {
  const cor = PALETA[indice % PALETA.length];
  return {
    code: c.sigla ?? String(c.id),
    name: c.nome,
    accentClassName: cor.accent,
    dotClassName: cor.dot,
    opportunities: c.total_oportunidades,
    services: c.servicos.map((s) => ({
      icon: Wrench,
      name: s.nome,
      iconClassName: cor.icone,
    })),
  };
}
