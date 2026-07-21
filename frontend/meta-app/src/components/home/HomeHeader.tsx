import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/Button";

const today = new Date();
const formattedDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(today);

export function HomeHeader({ userName }: { userName: string }) {
  return (
    <PageHeader
      eyebrow="INÍCIO"
      title={`Olá, ${userName}!`}
      description={`Aqui está o que está acontecendo na Meta hoje, ${formattedDate}.`}
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
