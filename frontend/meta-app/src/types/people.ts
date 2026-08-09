/** GET /rh/diretorio — membro com célula(s)/coordenação(ões)/cargo(s) resolvidos. */
export interface DiretorioMembroApi {
  id: number;
  nome: string;
  email: string;
  celulas: { id: number; nome: string; sigla: string | null }[];
  coordenacoes: { id: number; nome: string; sigla: string | null }[];
  cargos: { id: number; nome: string }[];
}

/** GET /rh/celulas */
export interface CelulaApi {
  id: number;
  nome: string;
  sigla: string | null;
}

/** GET /rh/coordenacoes */
export interface CoordenacaoApi {
  id: number;
  celula_id: number | null;
  nome: string;
  sigla: string | null;
}

export interface CelulaGroup {
  id: number | "sem-celula";
  nome: string;
  sigla: string | null;
  membros: DiretorioMembroApi[];
}

/** Agrupa membros pela primeira célula a que pertencem — a mesma leitura que
 * a BDU usa em "Mapa & Pessoas" (célula como unidade organizacional principal).
 * Membro sem nenhuma célula cadastrada cai num grupo "Sem célula" em vez de
 * sumir da lista. */
export function agruparPorCelula(
  membros: DiretorioMembroApi[],
  celulas: CelulaApi[],
): CelulaGroup[] {
  const grupos = new Map<number | "sem-celula", CelulaGroup>();

  for (const celula of celulas) {
    grupos.set(celula.id, { id: celula.id, nome: celula.nome, sigla: celula.sigla, membros: [] });
  }

  for (const membro of membros) {
    const celula = membro.celulas[0];
    const chave = celula ? celula.id : "sem-celula";
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        id: chave,
        nome: celula ? celula.nome : "Sem célula",
        sigla: celula ? celula.sigla : null,
        membros: [],
      });
    }
    grupos.get(chave)!.membros.push(membro);
  }

  return [...grupos.values()]
    .filter((g) => g.membros.length > 0 || g.id !== "sem-celula")
    .sort((a, b) => b.membros.length - a.membros.length);
}
