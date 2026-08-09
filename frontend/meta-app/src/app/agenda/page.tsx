import type { Metadata } from "next";
import { AgendaPlanner } from "@/components/agenda/AgendaPlanner";

export const metadata: Metadata = {
  title: "Agenda TI | Meta App",
  description: "Agenda semanal de indisponibilidades e melhores horarios para reuniao.",
};

export default function AgendaPage() {
  return <AgendaPlanner />;
}
