"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export interface ApiState<T> {
  data: T | null;
  erro: string | null;
  carregando: boolean;
}

/**
 * Busca dados da API a partir de um Client Component.
 *
 * Os dados do app dependem do token guardado no localStorage, então não dá
 * para buscá-los no servidor — daí o padrão ser useEffect, o mesmo já usado
 * por lib/auth-context.tsx. `apiFetch` cuida do refresh de token e do logout
 * quando o refresh também falha.
 *
 * Para várias rotas de uma vez, ver `useApiVarios`.
 */
export function useApi<T>(path: string): ApiState<T> {
  const [estado, setEstado] = useState<ApiState<T>>({
    data: null,
    erro: null,
    carregando: true,
  });
  const [pathAnterior, setPathAnterior] = useState(path);

  // Reset feito durante o render, não dentro do efeito: é o padrão do React
  // para "resetar estado quando uma prop muda". Fazê-lo no efeito dispara
  // renders em cascata e ainda deixa os dados da rota anterior visíveis por
  // um frame — o que na paginação da tabela aparecia como a página velha
  // piscando antes da nova.
  if (path !== pathAnterior) {
    setPathAnterior(path);
    setEstado({ data: null, erro: null, carregando: true });
  }

  useEffect(() => {
    let cancelado = false;

    apiFetch<T>(path)
      .then((data) => {
        if (!cancelado) setEstado({ data, erro: null, carregando: false });
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setEstado({
            data: null,
            erro: e instanceof Error ? e.message : "Falha ao carregar os dados.",
            carregando: false,
          });
        }
      });

    // Evita setState depois que o componente saiu da tela.
    return () => {
      cancelado = true;
    };
  }, [path]);

  return estado;
}

/**
 * Igual ao `useApi`, para telas que precisam de mais de uma rota. As chamadas
 * saem em paralelo e um erro em qualquer uma derruba o conjunto — as telas que
 * usam isto não têm o que mostrar com dados pela metade.
 *
 * `paths` é lido apenas na primeira renderização; passar um array novo a cada
 * render não redispara as chamadas (e é o que se quer, já que as rotas destas
 * telas são fixas).
 */
export function useApiVarios<T extends unknown[]>(paths: string[]): ApiState<T> {
  const [estado, setEstado] = useState<ApiState<T>>({
    data: null,
    erro: null,
    carregando: true,
  });
  const chave = paths.join("|");
  const [chaveAnterior, setChaveAnterior] = useState(chave);

  // Mesmo reset-durante-render do `useApi`.
  if (chave !== chaveAnterior) {
    setChaveAnterior(chave);
    setEstado({ data: null, erro: null, carregando: true });
  }

  useEffect(() => {
    let cancelado = false;

    Promise.all(chave.split("|").map((p) => apiFetch(p)))
      .then((data) => {
        if (!cancelado) setEstado({ data: data as T, erro: null, carregando: false });
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setEstado({
            data: null,
            erro: e instanceof Error ? e.message : "Falha ao carregar os dados.",
            carregando: false,
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [chave]);

  return estado;
}
