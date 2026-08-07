"use client";

import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

export function HomeHeader() {
  const { user } = useAuth();

  // A saudação usa só o primeiro nome; full_name traz o nome completo.
  const primeiroNome = user?.name?.split(" ")[0] ?? "";
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!";

  // Calculado a cada render, não no carregamento do módulo: com a data no
  // escopo do módulo, uma aba aberta durante a virada do dia seguiria
  // mostrando a data de ontem.
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <PageHeader
      eyebrow="INÍCIO"
      title={saudacao}
      description={`Aqui está o que está acontecendo na Meta hoje, ${dataFormatada}.`}
      actions={
        <>
          <LinkButton href="/forms" variant="secondary" icon={<ClipboardList className="h-4 w-4" />} iconPosition="left">
            Formulários
          </LinkButton>
          <LinkButton href="/pape" icon={<Plus className="h-4 w-4" />} iconPosition="left">
            Responder PAPE
          </LinkButton>
        </>
      }
    />
  );
}
