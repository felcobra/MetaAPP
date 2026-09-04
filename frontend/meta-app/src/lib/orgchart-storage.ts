import { coletarIds, indexarNos, type FormatoDeArvore } from "@/lib/orgchart-tree";

/**
 * Guarda a hierarquia reorganizada no navegador. O backend NÃO é alterado:
 * não existe operação de mover nó na API, então esta reorganização vale só
 * para quem está usando o navegador.
 *
 * Salvamos apenas o "esqueleto" de ids — nunca os dados das pessoas — e na
 * leitura remontamos a árvore com os dados frescos que vieram do servidor.
 * Assim uma foto ou um nome atualizado no RH aparece normalmente, em vez de
 * ficar congelado no que estava salvo.
 *
 * O gráfico e o painel de estrutura usam a MESMA chave por divisão, então uma
 * reorganização feita num lugar aparece no outro.
 */

interface Esqueleto {
  id: string;
  filhos: Esqueleto[];
}

export function chaveDeArmazenamento(divisaoId: string) {
  return `metaapp:orgchart:${divisaoId}`;
}

function extrairEsqueleto<T>(no: T, formato: FormatoDeArvore<T>): Esqueleto {
  return {
    id: formato.idDe(no),
    filhos: formato.filhosDe(no).map((filho) => extrairEsqueleto(filho, formato)),
  };
}

function idsDoEsqueleto(esqueleto: Esqueleto): string[] {
  return [esqueleto.id, ...esqueleto.filhos.flatMap(idsDoEsqueleto)];
}

function assinatura(ids: string[]) {
  return [...ids].sort().join("|");
}

/** Remonta a árvore na ordem do esqueleto, usando os nós atuais do servidor. */
function aplicarEsqueleto<T>(
  esqueleto: Esqueleto,
  indice: Map<string, T>,
  formato: FormatoDeArvore<T>,
): T | null {
  const base = indice.get(esqueleto.id);
  if (!base) return null;

  const filhos = esqueleto.filhos
    .map((filho) => aplicarEsqueleto(filho, indice, formato))
    .filter((filho): filho is T => filho !== null);

  return formato.comFilhos(base, filhos);
}

export function salvarEstrutura<T>(chave: string, raiz: T, formato: FormatoDeArvore<T>) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(extrairEsqueleto(raiz, formato)));
  } catch {
    // localStorage indisponível (aba privada, cota cheia): a estrutura segue
    // valendo em memória durante a sessão, então não vale interromper o usuário.
  }
}

export function limparEstrutura(chave: string) {
  try {
    window.localStorage.removeItem(chave);
  } catch {
    // idem: falhar aqui não deve quebrar a tela.
  }
}

/**
 * Estrutura salva para esta divisão, ou null se não houver nenhuma.
 * Se o servidor ganhou ou perdeu nós desde o último salvamento, a versão salva
 * é descartada — é mais seguro voltar para a hierarquia oficial do que tentar
 * adivinhar onde encaixar um cargo novo.
 */
export function lerEstruturaSalva<T>(
  chave: string,
  raizDoServidor: T,
  formato: FormatoDeArvore<T>,
): T | null {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return null;

    const esqueleto = JSON.parse(bruto) as Esqueleto;

    if (assinatura(idsDoEsqueleto(esqueleto)) !== assinatura(coletarIds(raizDoServidor, formato))) {
      limparEstrutura(chave);
      return null;
    }

    return aplicarEsqueleto(esqueleto, indexarNos(raizDoServidor, formato), formato);
  } catch {
    return null;
  }
}
