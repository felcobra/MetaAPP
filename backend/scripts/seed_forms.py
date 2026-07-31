"""
Seed script — Popula os templates de formulários dinâmicos do sistema.
Cria: PAPE (14 etapas), Avaliação 360 (8 etapas), Acompanhamento de Consultores (10 etapas)

Uso:
    cd backend
    python scripts/seed_forms.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.forms import FormTemplate, FormStep, FormField


PAPE_DATA = {
    "titulo": "PAPE",
    "subtitulo": "Plano de Acompanhamento de Projetos Externos",
    "descricao": "Acompanhe o progresso, prazos e entregas dos projetos externos sob sua gestão.",
    "frequencia": "QUINZENAL",
    "duracao_estimada": "~12 min",
    "publico_alvo": "Gerentes de Projetos",
    "steps": [
        {
            "index": 1, "section_label": "PROCEDIMENTOS INICIAIS",
            "titulo": "Dados do projeto",
            "descricao": "Confirme as informações iniciais do contrato.",
            "fields": [
                {"tipo": "date", "label": "Qual a data oficial de início do projeto?", "required": True, "ordem": 1},
                {"tipo": "text", "label": "Número do contrato", "required": True, "helper": "Exemplo: 111.1111", "placeholder": "000.0000", "ordem": 2},
                {"tipo": "text", "label": "Cliente / Empresa contratante", "required": True, "placeholder": "Razão social do cliente", "ordem": 3},
                {"tipo": "radio", "label": "Modalidade do projeto", "required": True, "options": ["Presencial", "Híbrido", "Remoto"], "ordem": 4},
                {"tipo": "textarea", "label": "Resumo executivo do projeto", "helper": "Máx. 500 caracteres", "max_length": 500, "placeholder": "Descreva brevemente o objetivo e escopo do projeto...", "ordem": 5},
            ],
        },
        {
            "index": 2, "section_label": "PROCEDIMENTOS INICIAIS",
            "titulo": "Escopo e objetivos",
            "descricao": "Detalhe o que foi combinado com o cliente.",
            "fields": [
                {"tipo": "textarea", "label": "Quais são os principais entregáveis do projeto?", "required": True, "placeholder": "Liste os entregáveis combinados em contrato...", "ordem": 1},
                {"tipo": "text", "label": "Qual o prazo total previsto (em semanas)?", "required": True, "placeholder": "Ex: 12", "ordem": 2},
                {"tipo": "radio", "label": "O escopo sofreu alterações desde o kickoff?", "options": ["Sim", "Não"], "ordem": 3},
            ],
        },
        {
            "index": 3, "section_label": "EQUIPE",
            "titulo": "Composição da equipe",
            "descricao": "Quem está alocado neste projeto.",
            "fields": [
                {"tipo": "text", "label": "Quantos consultores estão alocados no projeto?", "required": True, "placeholder": "Ex: 3", "ordem": 1},
                {"tipo": "textarea", "label": "Nomes dos consultores responsáveis", "placeholder": "Um nome por linha...", "ordem": 2},
            ],
        },
        {
            "index": 4, "section_label": "CRONOGRAMA",
            "titulo": "Aderência ao cronograma",
            "descricao": "Avalie o andamento das entregas planejadas.",
            "fields": [
                {"tipo": "radio", "label": "O projeto está dentro do cronograma?", "required": True, "options": ["No prazo", "Em atenção", "Atrasado"], "ordem": 1},
                {"tipo": "textarea", "label": "Se houver atraso, qual o motivo principal?", "placeholder": "Descreva os principais bloqueios...", "ordem": 2},
            ],
        },
        {
            "index": 5, "section_label": "CRONOGRAMA",
            "titulo": "Próximos marcos",
            "descricao": "Quais entregas estão previstas para o próximo ciclo.",
            "fields": [
                {"tipo": "date", "label": "Data do próximo marco de entrega", "required": True, "ordem": 1},
                {"tipo": "textarea", "label": "Descreva o marco", "placeholder": "O que será entregue neste marco...", "ordem": 2},
            ],
        },
        {
            "index": 6, "section_label": "FINANCEIRO",
            "titulo": "Situação financeira do contrato",
            "descricao": "Confirme os valores e o faturamento do período.",
            "fields": [
                {"tipo": "text", "label": "Valor total do contrato (R$)", "required": True, "placeholder": "0,00", "ordem": 1},
                {"tipo": "text", "label": "Valor já faturado (R$)", "required": True, "placeholder": "0,00", "ordem": 2},
                {"tipo": "radio", "label": "Há pendências de faturamento?", "options": ["Sim", "Não"], "ordem": 3},
            ],
        },
        {
            "index": 7, "section_label": "RISCOS",
            "titulo": "Mapeamento de riscos",
            "descricao": "Identifique riscos ativos que possam impactar o projeto.",
            "fields": [
                {"tipo": "radio", "label": "Existem riscos ativos no projeto?", "required": True, "options": ["Sim", "Não"], "ordem": 1},
                {"tipo": "textarea", "label": "Descreva os riscos identificados", "placeholder": "Detalhe cada risco e seu impacto potencial...", "ordem": 2},
            ],
        },
        {
            "index": 8, "section_label": "RISCOS",
            "titulo": "Plano de mitigação",
            "descricao": "Como a equipe está tratando os riscos mapeados.",
            "fields": [
                {"tipo": "textarea", "label": "Quais ações de mitigação estão em curso?", "placeholder": "Descreva as ações e responsáveis...", "ordem": 1},
            ],
        },
        {
            "index": 9, "section_label": "RELACIONAMENTO",
            "titulo": "Satisfação do cliente",
            "descricao": "Avalie a percepção do cliente sobre o andamento.",
            "fields": [
                {"tipo": "radio", "label": "Como está a satisfação do cliente?", "required": True, "options": ["Muito satisfeito", "Satisfeito", "Neutro", "Insatisfeito"], "ordem": 1},
                {"tipo": "textarea", "label": "Comentários adicionais sobre o relacionamento", "placeholder": "Feedbacks relevantes do cliente...", "ordem": 2},
            ],
        },
        {
            "index": 10, "section_label": "RELACIONAMENTO",
            "titulo": "Comunicação com o cliente",
            "descricao": "Frequência e qualidade dos alinhamentos.",
            "fields": [
                {"tipo": "radio", "label": "Qual a frequência de reuniões com o cliente?", "options": ["Semanal", "Quinzenal", "Mensal", "Sob demanda"], "ordem": 1},
            ],
        },
        {
            "index": 11, "section_label": "QUALIDADE",
            "titulo": "Qualidade das entregas",
            "descricao": "Avalie o nível de qualidade técnica do trabalho entregue.",
            "fields": [
                {"tipo": "radio", "label": "As entregas atendem ao padrão de qualidade Meta?", "required": True, "options": ["Sim", "Parcialmente", "Não"], "ordem": 1},
                {"tipo": "textarea", "label": "Pontos de melhoria identificados", "placeholder": "Descreva oportunidades de melhoria...", "ordem": 2},
            ],
        },
        {
            "index": 12, "section_label": "INDICADORES",
            "titulo": "Indicadores de resultado",
            "descricao": "Métricas quantitativas do projeto até o momento.",
            "fields": [
                {"tipo": "text", "label": "NPS do projeto (se aplicável)", "placeholder": "Ex: 85", "ordem": 1},
                {"tipo": "text", "label": "% de escopo entregue até o momento", "placeholder": "Ex: 60%", "ordem": 2},
            ],
        },
        {
            "index": 13, "section_label": "ENCERRAMENTO",
            "titulo": "Próximos passos",
            "descricao": "O que precisa acontecer até o próximo ciclo de acompanhamento.",
            "fields": [
                {"tipo": "textarea", "label": "Quais são as prioridades para a próxima quinzena?", "required": True, "placeholder": "Liste as próximas ações...", "ordem": 1},
            ],
        },
        {
            "index": 14, "section_label": "ENCERRAMENTO",
            "titulo": "Revisão final",
            "descricao": "Confirme as informações antes de enviar o PAPE.",
            "fields": [
                {"tipo": "radio", "label": "Confirma que todas as informações estão corretas?", "required": True, "options": ["Sim, revisado", "Preciso revisar novamente"], "ordem": 1},
                {"tipo": "textarea", "label": "Observações finais para o PMO", "placeholder": "Comentários adicionais...", "ordem": 2},
            ],
        },
    ],
}

AVALIACAO_360_DATA = {
    "titulo": "Avaliação 360",
    "subtitulo": "Feedback quinzenal entre pares",
    "descricao": "Forneça e receba feedback estruturado sobre comportamento, entregas e colaboração.",
    "frequencia": "QUINZENAL",
    "duracao_estimada": "~8 min",
    "publico_alvo": "Todos os colaboradores",
    "steps": [
        {
            "index": 1, "section_label": "DESEMPENHO",
            "titulo": "Entregas e resultados",
            "descricao": "Avalie as entregas do período.",
            "fields": [
                {"tipo": "radio", "label": "Como você avalia as entregas do colaborador neste período?", "required": True, "options": ["Excelente", "Bom", "Regular", "Abaixo do esperado"], "ordem": 1},
                {"tipo": "textarea", "label": "Exemplos concretos de entregas relevantes", "placeholder": "Descreva entregas ou resultados específicos...", "ordem": 2},
            ],
        },
        {
            "index": 2, "section_label": "DESEMPENHO",
            "titulo": "Qualidade técnica",
            "descricao": "Avalie a qualidade do trabalho entregue.",
            "fields": [
                {"tipo": "radio", "label": "A qualidade técnica das entregas atende ao padrão esperado?", "required": True, "options": ["Sempre", "Na maioria das vezes", "Às vezes", "Raramente"], "ordem": 1},
            ],
        },
        {
            "index": 3, "section_label": "COMPORTAMENTO",
            "titulo": "Colaboração e trabalho em equipe",
            "descricao": "Avalie como o colaborador trabalha com o time.",
            "fields": [
                {"tipo": "radio", "label": "Como você avalia a colaboração deste membro com o time?", "required": True, "options": ["Muito colaborativo", "Colaborativo", "Neutro", "Pouco colaborativo"], "ordem": 1},
                {"tipo": "textarea", "label": "Situações de colaboração ou falta dela", "placeholder": "Descreva situações específicas...", "ordem": 2},
            ],
        },
        {
            "index": 4, "section_label": "COMPORTAMENTO",
            "titulo": "Comunicação",
            "descricao": "Avalie a qualidade da comunicação.",
            "fields": [
                {"tipo": "radio", "label": "Como você avalia a comunicação deste colaborador?", "options": ["Excelente", "Boa", "Regular", "Precisa melhorar"], "ordem": 1},
            ],
        },
        {
            "index": 5, "section_label": "DESENVOLVIMENTO",
            "titulo": "Pontos fortes",
            "descricao": "Reconheça os pontos fortes do colaborador.",
            "fields": [
                {"tipo": "textarea", "label": "Quais são os principais pontos fortes deste colaborador?", "required": True, "placeholder": "Liste os pontos fortes observados...", "ordem": 1},
            ],
        },
        {
            "index": 6, "section_label": "DESENVOLVIMENTO",
            "titulo": "Oportunidades de melhoria",
            "descricao": "Indique áreas de desenvolvimento.",
            "fields": [
                {"tipo": "textarea", "label": "Quais oportunidades de desenvolvimento você identificou?", "placeholder": "Seja específico e construtivo...", "ordem": 1},
            ],
        },
        {
            "index": 7, "section_label": "FEEDBACK GERAL",
            "titulo": "Avaliação geral",
            "descricao": "Avaliação consolidada do período.",
            "fields": [
                {"tipo": "radio", "label": "Avaliação geral do colaborador neste ciclo", "required": True, "options": ["Acima das expectativas", "Dentro das expectativas", "Abaixo das expectativas"], "ordem": 1},
                {"tipo": "textarea", "label": "Mensagem final para o colaborador", "placeholder": "Uma mensagem de feedback direta e construtiva...", "ordem": 2},
            ],
        },
        {
            "index": 8, "section_label": "REVISÃO",
            "titulo": "Confirmação do feedback",
            "descricao": "Revise antes de enviar.",
            "fields": [
                {"tipo": "radio", "label": "Confirma que o feedback está completo e construtivo?", "required": True, "options": ["Sim, confirmo", "Preciso revisar"], "ordem": 1},
            ],
        },
    ],
}

ACOMP_CONSULTORES_DATA = {
    "titulo": "Acompanhamento de Consultores",
    "subtitulo": "Pulse mensal do time de consultoria",
    "descricao": "Avaliação de carga, satisfação e blockers dos consultores alocados em cada frente.",
    "frequencia": "MENSAL",
    "duracao_estimada": "~10 min",
    "publico_alvo": "Gerentes de Projetos",
    "steps": [
        {
            "index": 1, "section_label": "IDENTIFICAÇÃO",
            "titulo": "Dados do consultor",
            "descricao": "Identifique o consultor sendo avaliado.",
            "fields": [
                {"tipo": "text", "label": "Nome do consultor", "required": True, "placeholder": "Nome completo", "ordem": 1},
                {"tipo": "text", "label": "Projeto em que está alocado", "required": True, "placeholder": "Nome do projeto", "ordem": 2},
            ],
        },
        {
            "index": 2, "section_label": "CARGA DE TRABALHO",
            "titulo": "Carga e alocação",
            "descricao": "Avalie a carga de trabalho do consultor.",
            "fields": [
                {"tipo": "radio", "label": "Como está a carga de trabalho do consultor?", "required": True, "options": ["Subutilizado", "Adequado", "Sobrecarregado"], "ordem": 1},
                {"tipo": "text", "label": "Horas semanais estimadas", "placeholder": "Ex: 20", "ordem": 2},
            ],
        },
        {
            "index": 3, "section_label": "SATISFAÇÃO",
            "titulo": "Satisfação no projeto",
            "descricao": "Avalie a satisfação do consultor com o projeto.",
            "fields": [
                {"tipo": "radio", "label": "O consultor demonstra satisfação com as atividades?", "required": True, "options": ["Muito satisfeito", "Satisfeito", "Neutro", "Insatisfeito"], "ordem": 1},
                {"tipo": "textarea", "label": "Sinais observados de satisfação ou insatisfação", "placeholder": "Descreva comportamentos ou comentários do consultor...", "ordem": 2},
            ],
        },
        {
            "index": 4, "section_label": "BLOCKERS",
            "titulo": "Bloqueios e dificuldades",
            "descricao": "Identifique o que está impedindo o consultor de performar melhor.",
            "fields": [
                {"tipo": "radio", "label": "O consultor enfrenta bloqueios no projeto?", "options": ["Sim", "Não"], "ordem": 1},
                {"tipo": "textarea", "label": "Descreva os bloqueios e como estão sendo tratados", "placeholder": "Bloqueios técnicos, relacionais, de acesso...", "ordem": 2},
            ],
        },
        {
            "index": 5, "section_label": "DESENVOLVIMENTO",
            "titulo": "Aprendizado e crescimento",
            "descricao": "O consultor está evoluindo no projeto.",
            "fields": [
                {"tipo": "radio", "label": "O projeto está gerando aprendizado para o consultor?", "options": ["Muito", "Moderado", "Pouco", "Nenhum"], "ordem": 1},
            ],
        },
        {
            "index": 6, "section_label": "ENTREGA",
            "titulo": "Qualidade das entregas",
            "descricao": "Avalie o que o consultor está entregando.",
            "fields": [
                {"tipo": "radio", "label": "A qualidade das entregas do consultor está dentro do esperado?", "required": True, "options": ["Acima", "Dentro", "Abaixo"], "ordem": 1},
                {"tipo": "textarea", "label": "Exemplos de entregas do período", "placeholder": "Liste as principais contribuições...", "ordem": 2},
            ],
        },
        {
            "index": 7, "section_label": "RELACIONAMENTO",
            "titulo": "Relacionamento com o cliente",
            "descricao": "Como o consultor se relaciona com o cliente.",
            "fields": [
                {"tipo": "radio", "label": "Como está o relacionamento do consultor com o cliente?", "options": ["Excelente", "Bom", "Regular", "Problemático"], "ordem": 1},
            ],
        },
        {
            "index": 8, "section_label": "AÇÕES",
            "titulo": "Ações de suporte",
            "descricao": "O que você como gestor pode fazer para apoiar melhor.",
            "fields": [
                {"tipo": "textarea", "label": "Quais ações você vai tomar para apoiar o consultor?", "placeholder": "Mentorias, 1-1s, reforço de ferramentas...", "ordem": 1},
            ],
        },
        {
            "index": 9, "section_label": "AÇÕES",
            "titulo": "Plano de manutenção",
            "descricao": "Próximos passos de acompanhamento.",
            "fields": [
                {"tipo": "date", "label": "Data do próximo check-in com o consultor", "ordem": 1},
            ],
        },
        {
            "index": 10, "section_label": "REVISÃO",
            "titulo": "Confirmação final",
            "descricao": "Revise antes de enviar.",
            "fields": [
                {"tipo": "radio", "label": "O acompanhamento está completo?", "required": True, "options": ["Sim, enviar", "Preciso completar"], "ordem": 1},
                {"tipo": "textarea", "label": "Observações para o PMO", "placeholder": "Comentários adicionais...", "ordem": 2},
            ],
        },
    ],
}


async def seed_template(session, data: dict):
    """Cria ou ignora o template se já existir (idempotente)."""
    r = await session.execute(
        select(FormTemplate).where(FormTemplate.titulo == data["titulo"])
    )
    if r.scalar_one_or_none():
        print(f"  ⏭  Template '{data['titulo']}' já existe — pulando.")
        return

    template = FormTemplate(
        titulo=data["titulo"],
        subtitulo=data.get("subtitulo"),
        descricao=data.get("descricao"),
        frequencia=data["frequencia"],
        duracao_estimada=data.get("duracao_estimada"),
        publico_alvo=data.get("publico_alvo"),
        ativo=True,
    )
    session.add(template)
    await session.flush()

    for step_data in data["steps"]:
        step = FormStep(
            template_id=template.id,
            index=step_data["index"],
            section_label=step_data.get("section_label"),
            titulo=step_data["titulo"],
            descricao=step_data.get("descricao"),
        )
        session.add(step)
        await session.flush()

        for field_data in step_data.get("fields", []):
            field = FormField(
                step_id=step.id,
                tipo=field_data["tipo"],
                label=field_data["label"],
                required=field_data.get("required", False),
                helper=field_data.get("helper"),
                placeholder=field_data.get("placeholder"),
                max_length=field_data.get("max_length"),
                options=field_data.get("options"),
                ordem=field_data.get("ordem", 0),
            )
            session.add(field)

    await session.commit()
    steps_count = len(data["steps"])
    print(f"  ✅ Template '{data['titulo']}' criado com {steps_count} etapas.")


async def main():
    print("🌱 Seed de Formulários — Meta App")
    print("=" * 45)

    async with AsyncSessionLocal() as session:
        for template_data in [PAPE_DATA, AVALIACAO_360_DATA, ACOMP_CONSULTORES_DATA]:
            await seed_template(session, template_data)

    print("\n✔ Seed concluído com sucesso!")


if __name__ == "__main__":
    asyncio.run(main())
