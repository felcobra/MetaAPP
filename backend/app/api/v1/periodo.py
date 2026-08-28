"""Recorte de período — filtro compartilhado pelas telas analíticas.

A barra do topo do frontend manda `data_inicio`/`data_fim` (datas puras, sem
hora). Aqui isso vira uma lista de condições SQL aplicável a qualquer coluna de
data, para que Comercial, Financeiro, Projetos externos e Dashboards recortem
pelo mesmo critério em vez de cada endpoint inventar o seu.

Duas decisões que valem por todos os endpoints:

- **Fim inclusivo.** As colunas variam entre DATE (`transacao.data`) e DATETIME
  (`oportunidade.criado_em`). Num DATETIME, `<= data_fim` cortaria fora tudo que
  aconteceu depois da meia-noite do último dia. Por isso o corte superior é
  `< data_fim + 1 dia`, que fecha o intervalo do jeito que a pessoa lê a tela.

- **Linha sem data fica de fora quando há recorte.** A comparação SQL já
  descarta NULL naturalmente; o comentário está aqui porque isso é uma escolha,
  não um acidente: em "Tudo" a linha sem data aparece, em qualquer recorte ela
  some. Ver `Periodo.ativo` para quem precisa avisar isso na resposta.
"""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, List, Optional

from fastapi import Query


@dataclass(frozen=True)
class Periodo:
    """Intervalo pedido pela tela. Ambos os lados são opcionais."""

    inicio: Optional[date] = None
    fim: Optional[date] = None

    @property
    def ativo(self) -> bool:
        """False quando a tela pediu "Tudo" — nenhum recorte a aplicar."""
        return self.inicio is not None or self.fim is not None

    def condicoes(self, coluna: Any) -> List[Any]:
        """Condições SQL do recorte para `coluna`. Lista vazia se não há recorte.

        Uso: `stmt.where(*periodo.condicoes(Oportunidade.criado_em))` — com
        lista vazia o `where(*[])` é um no-op, então o mesmo código serve para
        o caso "Tudo" sem `if` no endpoint.
        """
        condicoes: List[Any] = []
        if self.inicio is not None:
            condicoes.append(coluna >= self.inicio)
        if self.fim is not None:
            # Ver docstring do módulo: fim inclusivo mesmo em coluna DATETIME.
            condicoes.append(coluna < self.fim + timedelta(days=1))
        return condicoes


def periodo_param(
    data_inicio: Optional[date] = Query(
        None,
        description="Início do recorte (AAAA-MM-DD). Omitido = sem limite inferior.",
    ),
    data_fim: Optional[date] = Query(
        None,
        description="Fim do recorte (AAAA-MM-DD), inclusivo. Omitido = sem limite superior.",
    ),
) -> Periodo:
    """Dependência FastAPI: injeta o recorte pedido pela barra do topo.

    Datas invertidas (fim antes do início) são normalizadas trocando as pontas,
    em vez de devolver 422 ou uma tela vazia: é sempre erro de quem chamou, e o
    que a pessoa queria ver é o intervalo entre as duas datas.
    """
    if data_inicio and data_fim and data_fim < data_inicio:
        data_inicio, data_fim = data_fim, data_inicio
    return Periodo(inicio=data_inicio, fim=data_fim)
