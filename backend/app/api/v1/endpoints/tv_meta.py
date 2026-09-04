"""Endpoints da TV Meta — vídeo institucional exibido na Home.

O vídeo é um arquivo único em disco, fora do banco: quem tem role `admin`
substitui pela própria interface e todo mundo assiste. Os dados de exibição
(nome original, tamanho, quem trocou e quando) ficam num JSON ao lado do
arquivo, então publicar uma edição nova não exige migração nem deploy.

Atenção no deploy: `UPLOAD_DIR` precisa apontar para um volume persistente,
senão o vídeo enviado some quando o container é recriado.
"""
import json
import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from jose import JWTError

from app.api.deps import get_current_user, require_admin
from app.core.config import settings
from app.core.security import create_media_token, decode_token
from app.models.user import User
from app.schemas.tv_meta import VideoTvRead

logger = logging.getLogger("metaapp")

router = APIRouter()

# Nome fixo em disco: o vídeo é sempre "o vídeo da TV Meta", e a versão antiga
# é substituída. O nome que o admin subiu fica guardado no JSON, para a
# interface mostrar de onde veio o arquivo.
DIRETORIO = settings.UPLOAD_PATH / "tv-meta"
VIDEO_PATH = DIRETORIO / "video.mp4"
META_PATH = DIRETORIO / "video.json"

CHUNK = 1024 * 1024  # 1 MB por leitura — evita segurar o arquivo todo em RAM


def _ler_metadados() -> dict:
    """Lê o JSON ao lado do vídeo. Arquivo ausente ou corrompido não é erro:
    o vídeo continua tocando, só sem os dados de autoria."""
    try:
        with META_PATH.open(encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _estado_do_video(usuario: User) -> VideoTvRead:
    limite = settings.TV_META_MAX_UPLOAD_MB

    if not VIDEO_PATH.is_file():
        return VideoTvRead(disponivel=False, limite_upload_mb=limite)

    stat = VIDEO_PATH.stat()
    meta = _ler_metadados()

    atualizado_em = meta.get("atualizado_em")
    if not atualizado_em:
        # Vídeo colocado direto na pasta (seed inicial), sem JSON
        atualizado_em = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()

    # `v` muda junto com o arquivo: garante que, ao trocar o vídeo, o navegador
    # busque o novo em vez de servir o antigo que está no cache.
    token = create_media_token(usuario.id)
    stream_path = f"/tv-meta/video/stream?token={token}&v={int(stat.st_mtime)}"

    return VideoTvRead(
        disponivel=True,
        stream_url=stream_path,
        nome_arquivo=meta.get("nome_arquivo") or VIDEO_PATH.name,
        tamanho_bytes=stat.st_size,
        atualizado_em=atualizado_em,
        atualizado_por=meta.get("atualizado_por"),
        limite_upload_mb=limite,
    )


@router.get("/video", response_model=VideoTvRead, summary="Vídeo atual da TV Meta")
async def get_video(current_user: User = Depends(get_current_user)) -> VideoTvRead:
    """Dados do vídeo em cartaz, incluindo a URL de streaming já assinada.

    `stream_url` é um caminho relativo à raiz da API (o frontend concatena com
    a base) e vale enquanto o token embutido não expirar.
    """
    return _estado_do_video(current_user)


@router.post(
    "/video",
    response_model=VideoTvRead,
    summary="Substitui o vídeo da TV Meta (admin)",
)
async def upload_video(
    arquivo: UploadFile = File(..., description="Arquivo .mp4 da nova edição"),
    current_user: User = Depends(require_admin),
) -> VideoTvRead:
    """Recebe o novo vídeo e substitui o anterior.

    O arquivo é gravado em `.tmp` e só então renomeado por cima do vídeo atual:
    se o upload cair no meio, a edição que está no ar continua intacta.
    """
    nome_original = (arquivo.filename or "").strip()
    if not nome_original.lower().endswith(".mp4"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envie um arquivo .mp4 — é o formato que toca em todos os navegadores.",
        )
    if arquivo.content_type and not arquivo.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo inválido ({arquivo.content_type}). Envie um vídeo MP4.",
        )

    limite_bytes = settings.TV_META_MAX_UPLOAD_MB * 1024 * 1024
    DIRETORIO.mkdir(parents=True, exist_ok=True)
    temporario = DIRETORIO / f"video.{os.getpid()}.tmp"

    tamanho = 0
    try:
        with temporario.open("wb") as destino:
            while pedaco := await arquivo.read(CHUNK):
                tamanho += len(pedaco)
                if tamanho > limite_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=(
                            f"Vídeo maior que o limite de "
                            f"{settings.TV_META_MAX_UPLOAD_MB} MB."
                        ),
                    )
                destino.write(pedaco)

        if tamanho == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado está vazio.",
            )

        # Troca atômica: ninguém chega a ver um vídeo pela metade
        os.replace(temporario, VIDEO_PATH)
    except HTTPException:
        temporario.unlink(missing_ok=True)
        raise
    except OSError as exc:
        temporario.unlink(missing_ok=True)
        logger.exception("Falha ao gravar o vídeo da TV Meta: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível salvar o vídeo no servidor.",
        )
    finally:
        await arquivo.close()

    meta = {
        "nome_arquivo": nome_original,
        "content_type": arquivo.content_type or "video/mp4",
        "tamanho_bytes": tamanho,
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
        "atualizado_por": current_user.full_name or current_user.email,
    }
    try:
        with META_PATH.open("w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    except OSError:
        # Vídeo já está no ar; perder o JSON só apaga a autoria na interface.
        logger.warning("Vídeo da TV Meta salvo, mas os metadados não foram gravados.")

    logger.info(
        "TV Meta: vídeo substituído por %s (%s, %.1f MB)",
        current_user.email,
        nome_original,
        tamanho / 1024 / 1024,
    )
    return _estado_do_video(current_user)


@router.get("/video/stream", summary="Transmite o vídeo da TV Meta")
async def stream_video(
    token: str = Query(..., description="Token de mídia devolvido por GET /tv-meta/video"),
) -> FileResponse:
    """Entrega o arquivo para a tag <video>.

    A autenticação vem pela querystring porque um elemento <video> não manda o
    header `Authorization`. O token é do tipo `media`: só serve para ler mídia,
    não dá acesso ao resto da API.

    O `FileResponse` do Starlette responde requisições `Range` (206), então o
    navegador consegue avançar o vídeo sem baixar o arquivo inteiro.
    """
    nao_autorizado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Link do vídeo expirado. Recarregue a página.",
    )
    try:
        payload = decode_token(token)
    except JWTError:
        raise nao_autorizado
    if payload.get("type") != "media":
        raise nao_autorizado

    if not VIDEO_PATH.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum vídeo publicado na TV Meta.",
        )

    return FileResponse(
        VIDEO_PATH,
        media_type="video/mp4",
        headers={
            # `v` na URL muda a cada troca de vídeo, então dá para o navegador
            # guardar esta versão por bastante tempo.
            "Cache-Control": "private, max-age=86400",
            "Accept-Ranges": "bytes",
        },
    )
