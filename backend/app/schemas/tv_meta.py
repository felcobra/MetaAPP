"""Schemas da TV Meta — vídeo institucional exibido na Home."""
from datetime import datetime

from pydantic import BaseModel


class VideoTvRead(BaseModel):
    """Estado atual do vídeo da TV Meta.

    `stream_url` já vem com o token de leitura embutido — é o valor que o
    frontend joga direto no `src` da tag <video>.
    """

    disponivel: bool
    stream_url: str | None = None
    nome_arquivo: str | None = None
    tamanho_bytes: int | None = None
    atualizado_em: datetime | None = None
    atualizado_por: str | None = None
    # Teto aceito no upload, para a interface avisar antes de enviar o arquivo
    limite_upload_mb: int
