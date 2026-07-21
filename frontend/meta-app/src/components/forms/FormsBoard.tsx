"use client";

import { useMemo, useState } from "react";
import type { FormStatus, FormTask } from "@/types/forms";
import { CardEyebrow } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { FormTaskCard } from "./FormTaskCard";

const filterOptions: { id: "todos" | FormStatus; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pendente", label: "Pendentes" },
  { id: "em-andamento", label: "Em andamento" },
  { id: "concluido", label: "Concluídos" },
];

export function FormsBoard({ tasks }: { tasks: FormTask[] }) {
  const [filter, setFilter] = useState<"todos" | FormStatus>("todos");

  const filteredTasks = useMemo(
    () => (filter === "todos" ? tasks : tasks.filter((task) => task.status === filter)),
    [filter, tasks],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <CardEyebrow>FORMULÁRIOS</CardEyebrow>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
            Suas pendências
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Você tem {tasks.length} formulários disponíveis para responder.
          </p>
        </div>
        <Tabs options={filterOptions} value={filter} onChange={(id) => setFilter(id as typeof filter)} />
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <FormTaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
          Nenhum formulário encontrado para este filtro.
        </p>
      )}
    </div>
  );
}
