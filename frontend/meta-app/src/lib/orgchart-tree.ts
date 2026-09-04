import type { OrgNode, OrgNoApi } from "@/types/orgchart";

/**
 * Funções puras para mexer na hierarquia do organograma.
 *
 * O projeto guarda a MESMA hierarquia em dois formatos:
 *  - `OrgNode`  — usado pelo gráfico: id em texto, filhos em `children`;
 *  - `OrgNoApi` — usado pelo painel de estrutura: id numérico, filhos em `filhos`.
 *
 * Em vez de duplicar as regras (não ser pai de si mesmo, não criar ciclo, não
 * mover a raiz) para cada formato, as funções aqui recebem um
 * `FormatoDeArvore` que diz como ler e reconstruir um nó. Assim a regra de
 * "movimento válido" mora num único lugar e as duas telas usam a mesma.
 *
 * Mover um cargo significa reconstruir a árvore: tirar o nó da lista de filhos
 * do pai antigo e colocá-lo na lista do pai novo. Nada disso mexe em posição
 * em pixels — quem desenha (o gráfico) recalcula o layout a partir da árvore.
 */

export interface FormatoDeArvore<T> {
  /** Id do nó sempre como texto (o painel converte o número para texto). */
  idDe(no: T): string;
  filhosDe(no: T): T[];
  /** Devolve uma CÓPIA do nó com outra lista de filhos (nunca altera o original). */
  comFilhos(no: T, filhos: T[]): T;
}

export const FORMATO_ORG_NODE: FormatoDeArvore<OrgNode> = {
  idDe: (no) => no.id,
  filhosDe: (no) => no.children ?? [],
  // `children` volta a ser undefined quando fica vazio: é assim que o resto do
  // código distingue "folha" de "nó com lista vazia".
  comFilhos: (no, filhos) => ({ ...no, children: filhos.length > 0 ? filhos : undefined }),
};

export const FORMATO_ORG_NO_API: FormatoDeArvore<OrgNoApi> = {
  idDe: (no) => String(no.id),
  filhosDe: (no) => no.filhos,
  comFilhos: (no, filhos) => ({ ...no, filhos }),
};

// ── Leitura da árvore ────────────────────────────────────────────────────────

/** Todos os ids da árvore, em qualquer profundidade. */
export function coletarIds<T>(raiz: T, formato: FormatoDeArvore<T>): string[] {
  return [
    formato.idDe(raiz),
    ...formato.filhosDe(raiz).flatMap((filho) => coletarIds(filho, formato)),
  ];
}

/** Índice id → nó, para achar um nó sem varrer a árvore de novo. */
export function indexarNos<T>(
  raiz: T,
  formato: FormatoDeArvore<T>,
  mapa = new Map<string, T>(),
): Map<string, T> {
  mapa.set(formato.idDe(raiz), raiz);
  for (const filho of formato.filhosDe(raiz)) indexarNos(filho, formato, mapa);
  return mapa;
}

/** Assinatura textual da estrutura — serve para saber se algo mudou. */
export function assinaturaDaEstrutura<T>(raiz: T, formato: FormatoDeArvore<T>): string {
  const filhos = formato.filhosDe(raiz).map((filho) => assinaturaDaEstrutura(filho, formato));
  return `${formato.idDe(raiz)}(${filhos.join(",")})`;
}

/** Mapa id → id do gestor direto (null na raiz). */
export type MapaDePais = Map<string, string | null>;

export function construirMapaDePais<T>(raiz: T, formato: FormatoDeArvore<T>): MapaDePais {
  const pais: MapaDePais = new Map();

  function percorrer(no: T, idDoPai: string | null) {
    const id = formato.idDe(no);
    pais.set(id, idDoPai);
    for (const filho of formato.filhosDe(no)) percorrer(filho, id);
  }

  percorrer(raiz, null);
  return pais;
}

// ── Validação do movimento ───────────────────────────────────────────────────

export type Validacao = { ok: true; semEfeito: boolean } | { ok: false; motivo: string };

/**
 * Regra única de "este movimento pode?". Trabalha só com o mapa de pais, por
 * isso serve para qualquer formato de árvore.
 *
 * `semEfeito` marca o caso em que o destino já é o gestor atual: é válido, mas
 * não muda nada, então quem chama pode simplesmente ignorar.
 */
export function validarMovimentoEm(
  pais: MapaDePais,
  idRaiz: string,
  idArrastado: string,
  idNovoPai: string,
): Validacao {
  if (idArrastado === idNovoPai) {
    return { ok: false, motivo: "Um cargo não pode ser subordinado a ele mesmo." };
  }

  if (idArrastado === idRaiz) {
    return { ok: false, motivo: "O cargo do topo não pode ser movido." };
  }

  if (!pais.has(idArrastado) || !pais.has(idNovoPai)) {
    return { ok: false, motivo: "Cargo não encontrado na estrutura." };
  }

  // Ciclo: subindo a cadeia de gestores do destino, se aparecer o cargo que
  // está sendo arrastado, é porque o destino está dentro da equipe dele — o
  // movimento desconectaria a árvore.
  let atual: string | null | undefined = idNovoPai;
  while (atual != null) {
    if (atual === idArrastado) {
      return { ok: false, motivo: "Não é possível mover um cargo para dentro da própria equipe." };
    }
    atual = pais.get(atual);
  }

  return { ok: true, semEfeito: pais.get(idArrastado) === idNovoPai };
}

export function validarMovimento<T>(
  raiz: T,
  formato: FormatoDeArvore<T>,
  idArrastado: string,
  idNovoPai: string,
): Validacao {
  return validarMovimentoEm(
    construirMapaDePais(raiz, formato),
    formato.idDe(raiz),
    idArrastado,
    idNovoPai,
  );
}

// ── Movimento ────────────────────────────────────────────────────────────────

export type Movimento<T> = { ok: true; raiz: T } | { ok: false; motivo: string };

/**
 * Devolve uma árvore NOVA com `idArrastado` como filho de `idNovoPai`.
 * A árvore original nunca é alterada — é isso que faz o "Descartar" funcionar.
 */
export function moverNo<T>(
  raiz: T,
  formato: FormatoDeArvore<T>,
  idArrastado: string,
  idNovoPai: string,
): Movimento<T> {
  const validacao = validarMovimento(raiz, formato, idArrastado, idNovoPai);

  if (!validacao.ok) return { ok: false, motivo: validacao.motivo };
  if (validacao.semEfeito) return { ok: true, raiz };

  const arrastado = indexarNos(raiz, formato).get(idArrastado)!;

  function reconstruir(no: T): T {
    const filhos = formato
      .filhosDe(no)
      // Tira o nó de onde estava antes de descer, então ele nunca duplica.
      .filter((filho) => formato.idDe(filho) !== idArrastado)
      .map(reconstruir);

    if (formato.idDe(no) === idNovoPai) filhos.push(arrastado);

    return formato.comFilhos(no, filhos);
  }

  return { ok: true, raiz: reconstruir(raiz) };
}
