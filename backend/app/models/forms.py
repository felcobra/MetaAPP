"""
Módulo de Formulários Dinâmicos (PAPE, Avaliação 360, Acompanhamento de Consultores)
Tabelas: form_template, form_step, form_field, form_submission, form_answer

Arquitetura:
- FormTemplate: cadastro do tipo de formulário (configurável, sem código fixo)
- FormStep: etapas de um formulário (index ordenado)
- FormField: campos dentro de uma etapa (tipo date/text/textarea/radio)
- FormSubmission: registro de preenchimento por um membro para um projeto
- FormAnswer: resposta individual por campo (append de texto)
- FormStep e FormField usam CASCADE desde o template
"""
from datetime import datetime
from typing import Any

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Integer, JSON,
    Boolean, Enum as SAEnum, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class FormTemplate(Base):
    """Tipo de formulário configurável no sistema.
    Exemplos: PAPE (Quinzenal, 14 etapas), Avaliação 360 (Quinzenal, 8 etapas).
    """
    __tablename__ = "form_template"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitulo: Mapped[str | None] = mapped_column(String(300), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    frequencia: Mapped[str] = mapped_column(
        SAEnum("QUINZENAL", "MENSAL", "SEMANAL", name="form_frequencia"),
        nullable=False,
    )
    duracao_estimada: Mapped[str | None] = mapped_column(String(50), nullable=True)   # ex: "~12 min"
    publico_alvo: Mapped[str | None] = mapped_column(String(200), nullable=True)      # ex: "Gerentes de Projetos"
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    steps = relationship(
        "FormStep", back_populates="template",
        cascade="all, delete-orphan",
        order_by="FormStep.index",
    )
    submissoes = relationship("FormSubmission", back_populates="template")

    @property
    def total_steps(self) -> int:
        return len(self.steps)


class FormStep(Base):
    """Etapa de um formulário. Agrupada em seções (section_label).
    Cascade deletado junto com o template.
    """
    __tablename__ = "form_step"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("form_template.id", ondelete="CASCADE"), nullable=False, index=True
    )
    index: Mapped[int] = mapped_column(Integer, nullable=False)           # 1-based
    section_label: Mapped[str | None] = mapped_column(String(100), nullable=True)  # ex: "PROCEDIMENTOS INICIAIS"
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    template = relationship("FormTemplate", back_populates="steps")
    fields = relationship(
        "FormField", back_populates="step",
        cascade="all, delete-orphan",
        order_by="FormField.ordem",
    )


class FormField(Base):
    """Campo de entrada dentro de uma etapa do formulário.
    options: lista de opções para campos do tipo radio (armazenado como JSON).
    """
    __tablename__ = "form_field"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    step_id: Mapped[int] = mapped_column(
        ForeignKey("form_step.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(
        SAEnum("date", "text", "textarea", "radio", name="form_field_tipo"),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    helper: Mapped[str | None] = mapped_column(String(300), nullable=True)
    placeholder: Mapped[str | None] = mapped_column(String(300), nullable=True)
    max_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    options: Mapped[Any | None] = mapped_column(JSON, nullable=True)   # ex: ["Sim", "Não"]
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    step = relationship("FormStep", back_populates="fields")


class FormSubmission(Base):
    """Submissão de um formulário por um membro, opcionalmente vinculada a um projeto.
    status segue o ciclo: pendente → em-andamento → concluido.
    UNIQUE(template_id, membro_id, ciclo): evita submissões duplicadas no mesmo ciclo.
    """
    __tablename__ = "form_submission"
    __table_args__ = (
        UniqueConstraint("template_id", "membro_id", "ciclo", name="uq_submission_ciclo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("form_template.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    membro_id: Mapped[int] = mapped_column(
        ForeignKey("membro.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    projeto_externo_id: Mapped[int | None] = mapped_column(
        ForeignKey("projeto_externo.id", ondelete="SET NULL"), nullable=True
    )
    ciclo: Mapped[str] = mapped_column(String(20), nullable=False)  # ex: "2026-Q14" ou "2026-07"
    status: Mapped[str] = mapped_column(
        SAEnum("pendente", "em-andamento", "concluido", name="submission_status"),
        default="pendente",
        nullable=False,
    )
    progresso: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100
    data_submissao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    template = relationship("FormTemplate", back_populates="submissoes")
    membro = relationship("Membro")
    projeto_externo = relationship("ProjetoExterno")
    respostas = relationship(
        "FormAnswer", back_populates="submissao",
        cascade="all, delete-orphan",
    )


class FormAnswer(Base):
    """Resposta de um campo em uma submissão.
    UNIQUE(submission_id, field_id): uma resposta por campo por submissão.
    """
    __tablename__ = "form_answer"
    __table_args__ = (
        UniqueConstraint("submission_id", "field_id", name="uq_answer_field"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("form_submission.id", ondelete="CASCADE"), nullable=False, index=True
    )
    field_id: Mapped[int] = mapped_column(
        ForeignKey("form_field.id", ondelete="RESTRICT"), nullable=False
    )
    valor: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    submissao = relationship("FormSubmission", back_populates="respostas")
    field = relationship("FormField")
