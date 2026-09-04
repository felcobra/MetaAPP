"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  assinaturaDaEstrutura,
  coletarIds,
  construirMapaDePais,
  moverNo,
  validarMovimentoEm,
  type FormatoDeArvore,
} from "@/lib/orgchart-tree";
import { lerEstruturaSalva, salvarEstrutura } from "@/lib/orgchart-storage";

/**
 * Estado do arrastar-e-soltar da hierarquia: pega um cargo e solta sobre outro
 * para trocar a relação pai/filho. Serve às duas telas — o gráfico
 * (`OrgNode`) e o painel de estrutura (`OrgNoApi`) — porque recebe o
 * `FormatoDeArvore` de quem chama.
 *
 * A ideia central é ter duas árvores:
 *  - `arvore`   → a estrutura confirmada, que a tela mostra normalmente;
 *  - `rascunho` → uma cópia usada enquanto o usuário reorganiza.
 *
 * "Salvar" promove o rascunho a árvore confirmada (e grava no navegador);
 * "Descartar" joga o rascunho fora. Nenhuma das duas altera o que veio do
 * servidor, e nenhuma escreve no banco.
 */

/** Tudo o que um card (ou uma linha) precisa para participar do arraste. */
export interface OrgNodeEdicao {
  arrastavel: boolean;
  arrastando: boolean;
  /** Pode receber o cargo que está sendo arrastado agora. */
  destinoPossivel: boolean;
  /** É o destino sob o cursor neste momento. */
  destinoAtivo: boolean;
  /** Está sob o cursor mas não aceita o movimento. */
  destinoInvalido: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

interface Avaliacao {
  valido: boolean;
  motivo?: string;
}

interface Opcoes {
  /** Painel de estrutura: já é uma tela de edição, então o arraste fica sempre
   * disponível, sem um botão "Editar" antes. */
  sempreEditando?: boolean;
}

export function useOrgChartEditor<T>(
  raizDoServidor: T,
  chaveDeArmazenamento: string,
  formato: FormatoDeArvore<T>,
  opcoes: Opcoes = {},
) {
  const { sempreEditando = false } = opcoes;

  // Estrutura confirmada. Começa na versão salva no navegador, se ela ainda
  // corresponder aos nós que o servidor devolveu.
  const [arvore, setArvore] = useState<T>(() => {
    if (typeof window === "undefined") return raizDoServidor;
    return lerEstruturaSalva(chaveDeArmazenamento, raizDoServidor, formato) ?? raizDoServidor;
  });

  // Null = ninguém reorganizou nada ainda; a tela mostra `arvore`.
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [sobreId, setSobreId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const modoEdicao = sempreEditando || rascunho !== null;
  const arvoreExibida = rascunho ?? arvore;
  const idDaRaiz = formato.idDe(arvoreExibida);

  // Só há o que salvar/descartar quando a estrutura realmente mudou.
  const temAlteracoes =
    rascunho !== null &&
    assinaturaDaEstrutura(rascunho, formato) !== assinaturaDaEstrutura(arvore, formato);

  // `raizDoServidor` é um objeto novo a cada render do componente pai, então
  // comparamos os ids: só quando um nó é criado/removido no painel vale
  // descartar a reorganização local e voltar para a estrutura oficial.
  const idsDoServidor = coletarIds(raizDoServidor, formato).sort().join("|");
  const ultimosIds = useRef(idsDoServidor);

  useEffect(() => {
    if (ultimosIds.current === idsDoServidor) return;
    ultimosIds.current = idsDoServidor;
    setRascunho(null);
    setArrastandoId(null);
    setSobreId(null);
    setArvore(lerEstruturaSalva(chaveDeArmazenamento, raizDoServidor, formato) ?? raizDoServidor);
  }, [idsDoServidor, raizDoServidor, chaveDeArmazenamento, formato]);

  // O aviso fica visível durante o arraste e desaparece pouco depois de soltar.
  useEffect(() => {
    if (!aviso || arrastandoId) return;
    const timer = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(timer);
  }, [aviso, arrastandoId]);

  // ── Controles ─────────────────────────────────────────────────────────────

  const iniciar = useCallback(() => {
    setAviso(null);
    setRascunho(arvore);
  }, [arvore]);

  const cancelar = useCallback(() => {
    setRascunho(null);
    setArrastandoId(null);
    setSobreId(null);
    setAviso(null);
  }, []);

  const salvar = useCallback(() => {
    if (!rascunho) return;
    setArvore(rascunho);
    setRascunho(null);
    setArrastandoId(null);
    setSobreId(null);
    setAviso(null);
    salvarEstrutura(chaveDeArmazenamento, rascunho, formato);
  }, [rascunho, chaveDeArmazenamento, formato]);

  // ── Arrastar e soltar ─────────────────────────────────────────────────────

  /** Para cada nó, se ele aceita o cargo em movimento (e por que não aceita). */
  const avaliacoes = useMemo(() => {
    if (!arrastandoId) return null;

    const pais = construirMapaDePais(arvoreExibida, formato);
    const mapa = new Map<string, Avaliacao>();

    for (const id of pais.keys()) {
      const resultado = validarMovimentoEm(pais, idDaRaiz, arrastandoId, id);

      if (!resultado.ok) mapa.set(id, { valido: false, motivo: resultado.motivo });
      else if (resultado.semEfeito)
        mapa.set(id, { valido: false, motivo: "Este cargo já é subordinado a esse gestor." });
      else mapa.set(id, { valido: true });
    }

    return mapa;
  }, [arrastandoId, arvoreExibida, formato, idDaRaiz]);

  function propsDeArraste(id: string): OrgNodeEdicao | undefined {
    if (!modoEdicao) return undefined;

    const avaliacao = avaliacoes?.get(id);
    const sobEsteNo = sobreId === id;

    return {
      arrastavel: id !== idDaRaiz,
      arrastando: arrastandoId === id,
      destinoPossivel: avaliacao?.valido === true,
      destinoAtivo: sobEsteNo && avaliacao?.valido === true,
      destinoInvalido: sobEsteNo && avaliacao?.valido === false,

      onDragStart(event) {
        // A raiz não tem gestor acima, então não há para onde movê-la.
        if (id === idDaRaiz) {
          event.preventDefault();
          setAviso("O cargo do topo não pode ser movido.");
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        // No painel a edição é sempre ativa, então o rascunho só nasce aqui.
        setRascunho((atual) => atual ?? arvore);
        setArrastandoId(id);
        setAviso(null);
      },

      onDragOver(event) {
        if (!arrastandoId || arrastandoId === id) return;

        setSobreId(id);

        // preventDefault é o que autoriza o "soltar" aqui: sem ele o navegador
        // mostra o cursor de bloqueado e o onDrop nunca dispara.
        if (avaliacao?.valido) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setAviso(null);
        } else if (avaliacao?.motivo) {
          setAviso(avaliacao.motivo);
        }
      },

      onDragLeave() {
        setSobreId((atual) => (atual === id ? null : atual));
      },

      onDrop(event) {
        event.preventDefault();

        const idArrastado = arrastandoId ?? event.dataTransfer.getData("text/plain");
        setSobreId(null);
        setArrastandoId(null);

        if (!idArrastado) return;

        const base = rascunho ?? arvore;
        const resultado = moverNo(base, formato, idArrastado, id);

        if (!resultado.ok) {
          setAviso(resultado.motivo);
          return;
        }

        // A árvore nova troca a hierarquia; níveis, posições e linhas são
        // recalculados a partir dela, sem posição em pixels para ajustar.
        setRascunho(resultado.raiz);
        setAviso(null);
      },

      onDragEnd() {
        setArrastandoId(null);
        setSobreId(null);
      },
    };
  }

  return {
    arvoreExibida,
    modoEdicao,
    temAlteracoes,
    aviso,
    iniciar,
    cancelar,
    salvar,
    propsDeArraste,
  };
}
