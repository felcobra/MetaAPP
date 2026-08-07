"""
Envio de e-mail por SMTP.

Deliberadamente genérico: qualquer servidor SMTP serve — Microsoft 365
(smtp.office365.com:587), ou um provedor transacional. Trocar de canal é mexer
nas variáveis de ambiente, não no código.

Se o SMTP não estiver configurado, `enviar_email` registra um aviso e devolve
False em vez de estourar. Quem chama decide o que fazer — no fluxo de
redefinição de senha a resposta ao usuário é a mesma de qualquer forma, para
não revelar quais e-mails existem.
"""
import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger("metaapp")


def smtp_configurado() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


async def enviar_email(destinatario: str, assunto: str, corpo_texto: str) -> bool:
    """Envia um e-mail de texto puro. Devolve True se o servidor aceitou."""
    if not smtp_configurado():
        logger.warning(
            "SMTP não configurado — e-mail para %s não foi enviado (assunto: %s). "
            "Defina SMTP_HOST, SMTP_USER e SMTP_PASSWORD.",
            destinatario, assunto,
        )
        return False

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = destinatario
    msg["Subject"] = assunto
    msg.set_content(corpo_texto)

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            # STARTTLS na 587 (o padrão do Microsoft 365); TLS direto na 465.
            start_tls=settings.SMTP_PORT == 587,
            use_tls=settings.SMTP_PORT == 465,
            timeout=20,
        )
        return True
    except Exception:
        # O motivo da falha nunca chega ao usuário: mensagens de SMTP revelam
        # se um endereço existe. Fica no log do servidor.
        logger.exception("Falha ao enviar e-mail para %s", destinatario)
        return False
